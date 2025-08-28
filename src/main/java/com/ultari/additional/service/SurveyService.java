package com.ultari.additional.service;

import static org.apache.commons.codec.CharEncoding.UTF_8;

import com.ultari.additional.domain.survey.BuddySurveyMember;
import com.ultari.additional.util.AmCodec;
import com.ultari.additional.util.AtMessengerCommunicator;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import com.ultari.additional.mapper.common.AlertMapper;
import com.ultari.additional.mapper.common.OrganizationMapper;
import java.util.stream.Collectors;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ultari.additional.domain.survey.Aggregate;
import com.ultari.additional.domain.survey.Survey;
import com.ultari.additional.domain.survey.SurveyItem;
import com.ultari.additional.domain.survey.SurveyMember;
import com.ultari.additional.domain.survey.SurveyQuestion;
import com.ultari.additional.domain.survey.SurveyResult;
import com.ultari.additional.domain.survey.SurveyResultDesc;
import com.ultari.additional.excel.constant.ExcelConstant;
import com.ultari.additional.mapper.common.SurveyMapper;
import com.ultari.additional.util.ApiManager;
import com.ultari.additional.util.PageManager;
import com.ultari.additional.util.StringUtil;
import com.ultari.additional.util.SurveyStatistics;

import kr.co.ultari.noti.api2.manager.data.NotiData;
import lombok.extern.slf4j.Slf4j;
import sun.nio.cs.ext.EUC_KR;

@Slf4j
@Service
public class SurveyService {
	@Autowired
	SurveyMapper surveyMapper;

	@Autowired
	ApiManager apiManager;

	@Autowired
	AlertMapper alertMapper;

	@Autowired
	OrganizationMapper organizationMapper;

	@Value("${common.api.survey-noti-domain}")
	private String NOTI_DOMAIN;

	public Map<String, Object> surveyList(Map<String, Object> data) throws Exception {
		String userId = (String) data.get("userId");
		int pageNo = (int)data.get("pageNo");

		int numberOfList = surveyMapper.numberOfList(data);

		PageManager pageManager = new PageManager();
		pageManager.setPageNo(pageNo);
		pageManager.setPageBlock(10);
		pageManager.setPageSize(10);
		pageManager.setTotalCount(numberOfList);
		pageManager.makePaging();

		data.put("startRowNo", pageManager.getStartRowNo());
		data.put("pageSize", pageManager.getPageSize());

		List<Survey> list = surveyMapper.surveyList(data);

		List<String> surveyCodes = list.stream()
			.map(Survey::getSurveyCode)
			.collect(Collectors.toList());

		List<SurveyMember> members = surveyMapper.surveyMemberListBySurveyCodes(surveyCodes);
		Map<String, List<SurveyMember>> memberMap = members.stream()
			.collect(Collectors.groupingBy(SurveyMember::getSurveyCode));


		for (Survey survey : list) {
			survey.setMemberList(memberMap.getOrDefault(survey.getSurveyCode(), Collections.emptyList()));
			collectAdditionalInformation(survey, userId);
		}

		Map<String, Object> map = new HashMap<>();
		map.put("list", list);
		map.put("mobileList", list);
		map.put("pageManager", pageManager);

		return map;
	}

//	private static final String SPO_HOST = "https://msgdev.spo.go.kr/spo/relay.jsp";


	private Map<String, String> buildBaseAlarmPayload(String userId, String surveyCode) {
		Map<String, String> payload = new HashMap<>();
		payload.put("userid", userId);
		payload.put("targetid", surveyCode);
		payload.put("type", "POLLALARM");
		payload.put("auth", "");
		payload.put("U", "10.0.0.173:8080/survey/article");
		return payload;
	}

	private String buildEncryptedRelayUrl(Map<String, String> basePayload, String time)
		throws UnsupportedEncodingException {
		Map<String, String> payload = new HashMap<>(basePayload); // 부작용 방지
		payload.put("time", time);
		String jsonString = new JSONObject(payload).toString();
		String encryptedInfo = new AmCodec().EncryptSEED(jsonString);
		String encodedInfo = URLEncoder.encode(encryptedInfo, "UTF-8");
		return "http://10.0.0.173:8888/spo/relay.jsp?info=" + encodedInfo;
	}

	@Transactional(rollbackFor = Exception.class)
	public void registSurvey(Map<String, Object> data) throws Exception {
		transSurvey(data);

		LocalDateTime now = LocalDateTime.now();
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
		String currentTime = now.format(formatter);

		if (data.containsKey("type")) {
			surveyMapper.removeQuestions(data);
			surveyMapper.removeItems(data);
		}

		surveyMapper.registSurvey(data);
		surveyMapper.registParticipants(data);
		surveyMapper.registQuestions(data);
		surveyMapper.registQuestionsItems(data);

		// 공통 payload 생성
		String userId = (String) data.get("userId");
		String surveyCode = String.valueOf(data.get("surveyCode"));
		Map<String, String> basePayload = buildBaseAlarmPayload(userId, surveyCode);

		// 최초 안내 URL (msg/relay.jsp)
		String directUrl = buildEncryptedRelayUrl(basePayload, currentTime);
		data.put("url", directUrl);

		System.out.println("basepayload: " + basePayload);
		alertSurvey(data, true);

		// 마감 알림 등록 로직
		if (data.containsKey("endDatetime")) {
			String endDatetimeStr = (String) data.get("endDatetime");
			formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
			LocalDateTime endDatetime = LocalDateTime.parse(endDatetimeStr, formatter);

			LocalDateTime tenMinutesBeforeEnd = endDatetime.minusMinutes(10);

			DateTimeFormatter alarmFormatter = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
			String tenMinutesBeforeEndAlarmStr = tenMinutesBeforeEnd.format(alarmFormatter);
			String endDatetimeAlarmStr = endDatetime.format(alarmFormatter);

			// 10분 전 URL (relay/relay.jsp)
			String tenMinutesBeforeUrl = buildEncryptedRelayUrl(basePayload, tenMinutesBeforeEndAlarmStr + "00");

			List<Map<String, String>> participantsList = (List<Map<String, String>>) data.get("participantsList");


			Map<String, String> writer = new HashMap<>();
			writer.put("key", userId);       // DB의 ID 컬럼에 들어갈 값
			participantsList.add(writer);
			System.out.println("participantsList: " + participantsList);
			System.out.println("wrtier"+writer);


			System.out.println("participantsList: " + participantsList);
			System.out.println("tenMinutesBeforeUrl: " + tenMinutesBeforeUrl);
			System.out.println("endDatetimeAlarmStr: " + endDatetimeAlarmStr);

			Map<String, Object> alarmData = new HashMap<>();
			alarmData.put("msgId", java.util.UUID.randomUUID().toString());
			alarmData.put("surveyId", data.get("surveyCode"));
			alarmData.put("id", userId);
			alarmData.put("subject", "미니투표 " + data.get("surveyTitle") + " 마감 10분전입니다.");
			alarmData.put("content", "미니투표 " + data.get("surveyTitle") + " 마감 10분전입니다.");
			alarmData.put("url", tenMinutesBeforeUrl);
			alarmData.put("before10m", "1");

			// 1. 마감 10분 전 알림 등록
			alarmData.put("pushTime", tenMinutesBeforeEndAlarmStr);
			alarmData.put("participantsList", participantsList);
			surveyMapper.registEndAlarm(alarmData);

			// 마감 즉시 URL (relay/relay.jsp)
			String endTimeURL = buildEncryptedRelayUrl(basePayload, endDatetimeAlarmStr + "00");

			// 2. 마감 즉시 알림 등록
			alarmData.put("pushTime", endDatetimeAlarmStr);
			alarmData.put("subject", "미니투표 " + data.get("surveyTitle") + "이 종료되었습니다.");
			alarmData.put("content", "미니투표 " + data.get("surveyTitle") + "이 종료되었습니다.");
			alarmData.put("url", endTimeURL);
			alarmData.put("before10m", "0");
			surveyMapper.registEndAlarm(alarmData);
		}
	}

	public Map<String, Object> survey(Map<String, Object> data) throws Exception {
		String userId = (String) data.get("userId");

		Survey survey = surveyMapper.survey(data);

		String surveyCode = survey.getSurveyCode();
		List<SurveyMember> members = surveyMapper.surveyMemberListBySurveyCodes(Collections.singletonList(surveyCode));

		Map<String, List<SurveyMember>> memberMap = members.stream()
			.collect(Collectors.groupingBy(SurveyMember::getSurveyCode));

		survey.setMemberList(memberMap.getOrDefault(surveyCode, Collections.emptyList()));
		List<SurveyQuestion> surveyQuestionList = surveyMapper.surveyQuestionList(data);
		//20250707 KHJ start
		for(SurveyQuestion surveyQuestion : surveyQuestionList) {
			List<SurveyItem> itemList = surveyQuestion.getItemList();
			for(SurveyItem item : itemList) {
				Map<String, Object> map = new HashMap<>();
				map.put("surveyCode",(String) data.get("surveyCode"));
				map.put("itemCode",item.getItemCode());

				log.debug("{}:{}",(String) data.get("surveyCode"),item.getItemCode());
				List<SurveyResult> resultList = surveyItemResultMember(map);
				for(SurveyResult result : resultList) {
					JSONObject json = new JSONObject();
					log.debug("{}:{}:{}:{}:{}",result.getItemCode(),result.getUserId(),result.getUserName(),result.getDeptName(),result.getDesc());
					json.put("questionCode",result.getQuestionCode());
					json.put("itemCode",result.getItemCode());
					json.put("userId",result.getUserId());
					json.put("userName",result.getUserName());
					json.put("deptName",result.getDeptName());
					json.put("desc",result.getDesc());
					json.put("dateTime",result.getDatetime());
					json.put("itemType",result.getItemType());
					json.put("itemNumber",result.getItemNumber());

					item.addUser(json.toString());
				}
			}
		}
		//20250707 KHJ end
		collectAdditionalInformation(survey, userId);

		List<SurveyResult> surveyResult = surveyMapper.surveyResult(data);
		List<Aggregate> surveyItemAggregate = surveyMapper.surveyItemAggregate(data);

		Map<String, Object> map = new HashMap<>();
		map.put("survey", survey);
		map.put("surveyQuestionList", surveyQuestionList);
		map.put("surveyResult", surveyResult);
		map.put("surveyItemAggregate", surveyItemAggregate);

		log.debug("{}",surveyQuestionList);

		return map;
	}

	@Transactional
	public void saveSurvey(Map<String, Object> data) throws Exception {
		surveyMapper.saveSurvey(data);

		// 새 참가자 리스트 추출
		List<Map<String, Object>> participantsList = (List<Map<String, Object>>) data.get("participantsList");
		String surveyCode = (String) data.get("surveyCode");

		// 새 참가자 userId 목록
		Set<String> newUserIds = participantsList.stream()
			.map(p -> (String) p.get("userId"))
			.collect(Collectors.toSet());

		// 기존 DB에서 참가자 userId 조회
		List<String> existingUserIds = surveyMapper.selectParticipantUserIds(surveyCode);

		// 삭제 대상: 기존에 있었지만 지금은 없는 사용자
		List<String> usersToDelete = existingUserIds.stream()
			.filter(id -> !newUserIds.contains(id))
			.collect(Collectors.toList());

		if (!usersToDelete.isEmpty()) {
			Map<String, Object> deleteParams = new HashMap<>();
			deleteParams.put("surveyCode", surveyCode);
			deleteParams.put("list", usersToDelete);
			surveyMapper.deleteParticipants(deleteParams);

			try {
				surveyMapper.deleteEndAlarmsForParticipants(deleteParams);
			} catch (Exception e) {
				log.error("알림 삭제 중 오류가 발생했습니다. surveyCode: {}", deleteParams.get("surveyCode"), e);
			}
		}
		//추가대상: 새 참가자 리스트 중 기존에 없던 사용자
		List<Map<String, Object>> newParticipantsToInsert = participantsList.stream()
			.filter(p -> !existingUserIds.contains((String) p.get("userId")))
			.collect(Collectors.toList());


		// currentTime 생성
		LocalDateTime now = LocalDateTime.now();
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
		String currentTime = now.format(formatter);

		// 공통 payload 생성
		String userId = (String) data.get("userId");
		Map<String, String> basePayload = buildBaseAlarmPayload(userId, surveyCode);

		// 최초 안내 URL
		String directUrl = buildEncryptedRelayUrl(basePayload, currentTime);
		data.put("url", directUrl);


		if (data.containsKey("endDatetime")) {
			String endDatetimeStr = (String) data.get("endDatetime");
			DateTimeFormatter dtFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
			LocalDateTime endDatetime = LocalDateTime.parse(endDatetimeStr, dtFormatter);

			LocalDateTime tenMinutesBeforeEnd = endDatetime.minusMinutes(10);
			DateTimeFormatter alarmFormatter = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
			String tenMinutesBeforeEndAlarmStr = tenMinutesBeforeEnd.format(alarmFormatter);
			String endDatetimeAlarmStr = endDatetime.format(alarmFormatter);


			Map<String, Object> alarmData = new HashMap<>();
			alarmData.put("msgId", java.util.UUID.randomUUID().toString());
			alarmData.put("surveyId", surveyCode);
			alarmData.put("id", data.get("userId"));

			// 추가대상: 새 참가자
			if (!newParticipantsToInsert.isEmpty()) {
				Map<String, Object> insertParams = new HashMap<>(data);
				insertParams.put("participantsList", newParticipantsToInsert);
				System.out.println("newParticipantsToInsert = " + newParticipantsToInsert);
				surveyMapper.registParticipants(insertParams);
				alertSurvey(insertParams, false);
			}

			// 1. 마감 10분 전 URL + 알림 등록
			String tenMinutesBeforeUrl = buildEncryptedRelayUrl(basePayload, tenMinutesBeforeEndAlarmStr + "00");
			alarmData.put("url", tenMinutesBeforeUrl);
			alarmData.put("pushTime", tenMinutesBeforeEndAlarmStr);
			alarmData.put("subject", "미니투표 " + data.get("surveyTitle") + " 마감 10분전입니다.");
			alarmData.put("content", "미니투표 " + data.get("surveyTitle") + " 마감 10분전입니다.");
			alarmData.put("participantsList", participantsList);
			alarmData.put("before10m", "1");
			surveyMapper.updateEndAlarm(alarmData);
			surveyMapper.registEndAlarm(alarmData);

			// 2. 마감 즉시 URL + 알림 등록
			String endTimeUrl = buildEncryptedRelayUrl(basePayload, endDatetimeAlarmStr + "00");
			alarmData.put("url", endTimeUrl);
			alarmData.put("pushTime", endDatetimeAlarmStr);
			alarmData.put("subject", "미니투표 " + data.get("surveyTitle") + "이 종료되었습니다.");
			alarmData.put("content", "미니투표 " + data.get("surveyTitle") + "이 종료되었습니다.");
			alarmData.put("before10m", "0");
			surveyMapper.updateEndAlarm(alarmData);
			surveyMapper.registEndAlarm(alarmData);
		}
	}

	public void removeSurvey(Map<String, Object> data) throws Exception {
		surveyMapper.removeSurvey(data);
		surveyMapper.removeAlarm(data);
	}

	@SuppressWarnings({ "unchecked" })
	@Transactional
	public void submitSurvey(Map<String, Object> data) throws Exception {
		surveyMapper.submitSurvey(data);
		surveyMapper.submitSurveyMember(data);
		List<Map<String, Object>> desc = (List<Map<String, Object>>)data.get("descList");
		if (desc.size() > 0) {
			surveyMapper.submitSurveyDesc(data);
		}
	}

	public List<SurveyResult> surveyItemResultMember(Map<String, Object> data) throws Exception {
		return surveyMapper.surveyItemResultMember(data);
	}

	public List<SurveyResultDesc> surveyResultDesc(Map<String, Object> data) throws Exception {
		return surveyMapper.surveyResultDesc(data);
	}

	private void transSurvey(Map<String, Object> data) {
		String surveyCode = StringUtil.uuid();
		if (data.containsKey("type") && data.get("type").equals("save")) {
			surveyCode = (String) data.get("surveyCode");
		}

		data.put("surveyCode", surveyCode);

		List<Map<String, Object>> questionList = (List<Map<String, Object>>) data.get("questionList");
		List<Map<String, Object>> participantsList = (List<Map<String, Object>>) data.get("participantsList");

		List<Map<String, Object>> questionItemList = new ArrayList<>();

		for (Map<String, Object> question : questionList) {
			String questionCode = StringUtil.uuid();
			if (question.containsKey("type") && question.get("type").equals("save")) {
				questionCode = (String) question.get("questionCode");
			}
			question.put("questionCode", questionCode);
			question.put("surveyCode", surveyCode);

			List<Map<String, Object>> questionItem = (List<Map<String,Object>>)question.get("questionItem");
			for (Map<String, Object> item : questionItem) {
				String itemCode = StringUtil.uuid();
				if (item.containsKey("type") && item.get("type").equals("save")) {
					itemCode = (String) item.get("itemCode");
				}
				item.put("itemCode", itemCode);
				item.put("questionCode", questionCode);

				questionItemList.add(item);
			}
		}

		data.put("questionItemList", questionItemList);
	}

	@Transactional
	public void alertSurvey(Map<String, Object> data, boolean isFirstRegister) throws Exception {
		List<Map<String, Object>> participantsList = (List<Map<String, Object>>) data.get("participantsList");
		String surveyTitle = (String) data.get("surveyTitle");
		String userId = (String) data.get("userId");
		String sndName = organizationMapper.memberById(userId).getUserName();
		String surveyCode = (String) data.get("surveyCode");
		String url=data.get("url").toString();
		String message = "미니투표 '" + surveyTitle + "'이 생성되었습니다.";

//		AtMessengerCommunicator atmc = new AtMessengerCommunicator("192.168.100.173", 1234, 1);
		AtMessengerCommunicator atmc = new AtMessengerCommunicator("10.0.0.177", 1234, 1);
		for(Map<String, Object> map : participantsList) {
			String member = (String) map.get("key");
			atmc.addMessage(member,  userId, message,url,message,"12345");
		}
		// 처음 등록일 때만 작성자 알림
		if (isFirstRegister) {
			atmc.addMessage(userId, userId, message, url, message, "12345");
		}
		atmc.send();
	}

	private void collectAdditionalInformation(Survey survey, String userId) {
		List<SurveyMember> memberList = survey.getMemberList();
		String isMember = "N";
		String isDone = "N";
		if (memberList != null) {
			for (SurveyMember member : memberList) {
				String key = member.getKey();
				if (key.equals(userId)) {
					isMember = "Y";
					isDone = member.getIsComplete();
				}
			}
		}

		String isWriter = "N";
		String uid = survey.getUserId();

		if (uid.equals(userId)) {
			isWriter = "Y";
		}

		survey.setIsMember(isMember);
		survey.setIsDone(isDone);
		survey.setIsWriter(isWriter);
	}

	private String notiUrl(String key, String surveyCode) {
		StringBuilder sb = new StringBuilder();

		sb.append(NOTI_DOMAIN).append("redirect/").append(key);
		sb.append("?redirect=").append("survey/article/").append(surveyCode);

		return sb.toString();
	}

	public Map<String, Object> noti(Map<String, Object> map) throws Exception {
		String code = "OK";
		try {
			log.debug(map.toString());
			List<String> list = surveyMapper.surveyMemberIdUncompleteBySurveyCode(map);
			String surveyCode = (String) map.get("surveyCode");
			String subject = (String) map.get("subject");
			String contents = (String) map.get("contents");
			String writer = (String) map.get("writer");

			log.debug(list.toString());
			int len = list.size();

			if (len > 0) {
				List<NotiData> notiList = new ArrayList<>();
				for (String key : list) {
					NotiData noti = new NotiData();
					noti.setMsgId(StringUtil.uuid());
					noti.setRcvId(key);
					noti.setSndName(writer);
					noti.setSubject(contents);
					noti.setContents(subject);
					noti.setSysCode("MINI_VOTE");
					noti.setSysTitle("미니투표");
					noti.setUrl(notiUrl(key, surveyCode));
					noti.setDatetime(StringUtil.datetime("yyyyMMddHHmmssSSS"));

					notiList.add(noti);
				}
				code = apiManager.noti(notiList);

				if (code.equals("SUCCESS")) code = "OK";
			}
		} catch(Exception e) {
			code = "FAIL";
			log.error("", e);
		}

		log.info(code);
		Map<String, Object> data = new HashMap<>();
		data.put("code", code);
		return data;
	}

	public Map<String, Object> export(Map<String, Object> map) throws Exception {
		Survey survey = surveyMapper.survey(map);

		List<SurveyMember> members = surveyMapper.surveyMemberList(map);
		survey.setMemberList(members);

		List<SurveyQuestion> surveyQuestionList = surveyMapper.surveyQuestionListWithoutItems(map);

		List<SurveyItem> surveyItemList = surveyMapper.surveyItemListBySurveyCode(map);

		/*for(SurveyItem item : surveyItemList) {
			Map<String, Object> tmp = new HashMap<>();
			tmp.put("surveyCode",survey.getSurveyCode());
			tmp.put("itemCode",item.getItemCode());

			log.debug("{}:{}",survey.getSurveyCode(),item.getItemCode());
			List<SurveyResult> resultList = surveyItemResultMember(tmp);
			for(SurveyResult result : resultList) {
				JSONObject json = new JSONObject();
				log.debug("{}:{}:{}:{}:{}",result.getItemCode(),result.getUserId(),result.getUserName(),result.getDeptName(),result.getDesc());
				json.put("questionCode",result.getQuestionCode());
				json.put("itemCode",result.getItemCode());
				json.put("userId",result.getUserId());
				json.put("userName",result.getUserName());
				json.put("deptName",result.getDeptName());
				json.put("desc",result.getDesc());
				json.put("dateTime",result.getDatetime());
				json.put("itemType",result.getItemType());
				json.put("itemNumber",result.getItemNumber());

				item.addUser(json.toString());
			}
		}*/

		List<SurveyResult> surveyResult = surveyMapper.surveyResultBySurveyCode(map);
		List<SurveyMember> surveyMemberList = surveyMapper.surveyMemberList(map);

		SurveyStatistics statistics = new SurveyStatistics(survey, surveyQuestionList, surveyItemList, surveyResult, surveyMemberList);
		//Map<String, Object> statisticsIndividualSelectionQuestions = statistics.individualSelectionQuestions();
		//Map<String, Object> statisticsByItem = statistics.statisticsByItem();
		Map<String, Object> statisticsSummary = statistics.statisticsSummary();


		List<Map<String, Object>> list = new ArrayList<>();
		//list.add(statisticsByItem);
		//list.add(statisticsIndividualSelectionQuestions);
		list.add(statisticsSummary);

		Map<String, Object> data = new HashMap<>();
		data.put(ExcelConstant.FILE_NAME, "미니투표_" + StringUtil.datetime("yyyyMMddHHmmss"));
		data.put("data", list);
		data.put(ExcelConstant.TYPE, "survey");

		return data;
	}


	public List<BuddySurveyMember> getMembersByBuddyId(Map<String, Object> map) {
		return surveyMapper.MemberListByBuddyId(map);
	}
}