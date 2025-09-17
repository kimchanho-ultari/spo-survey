package com.ultari.additional.service;

import static org.apache.commons.codec.CharEncoding.UTF_8;

import com.ultari.additional.domain.survey.BuddySurveyMember;
import com.ultari.additional.util.AmCodec;
import com.ultari.additional.util.AtMessengerCommunicator;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
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

//	private static final String SURVEY_DOMAIN = "https://msgdev.spo.go.kr";
	@Value("${survey.domain}")
	private String SURVEY_DOMAIN;
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

		String directUrl = SURVEY_DOMAIN+"/survey/article/?my="+userId+"&"+"surveyCode="+surveyCode;
		data.put("url", directUrl);
//		alertSurvey(data, true);



		formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
		String startDatetimeStr=(String)data.get("startDatetime");
		LocalDateTime startDatetime = LocalDateTime.parse(startDatetimeStr, formatter);
		if (startDatetime.isBefore(now)) {
			startDatetime = now.plusMinutes(1);
		}
		DateTimeFormatter alarmFormatter = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
		String startDatetimeAlarmStr=startDatetime.format(alarmFormatter);

		List<Map<String, String>> participantsList = (List<Map<String, String>>) data.get("participantsList");
		Map<String, String> writer = new HashMap<>();
		writer.put("key", userId);       // DB의 ID 컬럼에 들어갈 값
		participantsList.add(writer);

		for (Map<String, String> participant : participantsList) {
			String participantId = (String) participant.get("key"); // 또는 item.key
			String participantUrl = SURVEY_DOMAIN+"/survey/article/?my="
				+ participantId
				+ "&surveyCode=" + surveyCode;

			participant.put("url", participantUrl);
		}

		Map<String, Object> alarmData = new HashMap<>();
		alarmData.put("msgId", java.util.UUID.randomUUID().toString());
		alarmData.put("surveyId", data.get("surveyCode"));
		alarmData.put("id", userId);
		alarmData.put("participantsList", participantsList);

		//시작알림등록
		alarmData.put("subject", "미니투표"+data.get("surveyTitle") + "이 생성되었습니다.");
		alarmData.put("content", "미니투표"+data.get("surveyTitle") + "이 생성되었습니다.");
		alarmData.put("before10m", "1");
		alarmData.put("pushTime", startDatetimeAlarmStr);
		surveyMapper.removeAlarm(data);
		surveyMapper.registEndAlarm(alarmData);

		// 마감 알림 등록 로직
		if (data.containsKey("endDatetime") && "Y".equals(data.get("endAlarm"))) {
			String endDatetimeStr = (String) data.get("endDatetime");
			LocalDateTime endDatetime = LocalDateTime.parse(endDatetimeStr, formatter);

			LocalDateTime tenMinutesBeforeEnd = endDatetime.minusMinutes(10);

			String tenMinutesBeforeEndAlarmStr = tenMinutesBeforeEnd.format(alarmFormatter);
			String endDatetimeAlarmStr = endDatetime.format(alarmFormatter);



			//마감 10분전 알림 등록
			alarmData.put("subject", "미니투표 " + data.get("surveyTitle") + " 마감 10분전입니다.");
			alarmData.put("content", "미니투표 " + data.get("surveyTitle") + " 마감 10분전입니다.");
			alarmData.put("before10m", "1");
			alarmData.put("pushTime", tenMinutesBeforeEndAlarmStr);
			if(now.isBefore(tenMinutesBeforeEnd)) {
				surveyMapper.registEndAlarm(alarmData);
			}


			//마감 즉시 알림 등록
			alarmData.put("pushTime", endDatetimeAlarmStr);
			alarmData.put("subject", "미니투표 " + data.get("surveyTitle") + "이 종료되었습니다.");
			alarmData.put("content", "미니투표 " + data.get("surveyTitle") + "이 종료되었습니다.");
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


		if (data.containsKey("endDatetime")) {
			String endDatetimeStr = (String) data.get("endDatetime");
			DateTimeFormatter dtFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
			LocalDateTime endDatetime = LocalDateTime.parse(endDatetimeStr, dtFormatter);

			LocalDateTime tenMinutesBeforeEnd = endDatetime.minusMinutes(10);
			DateTimeFormatter alarmFormatter = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
			String tenMinutesBeforeEndAlarmStr = tenMinutesBeforeEnd.format(alarmFormatter);
			String endDatetimeAlarmStr = endDatetime.format(alarmFormatter);

			surveyMapper.removeAlarm(data);


			Map<String, Object> alarmData = new HashMap<>();
			alarmData.put("msgId", java.util.UUID.randomUUID().toString());
			alarmData.put("surveyId", surveyCode);
			alarmData.put("id", data.get("userId"));
			alarmData.put("participantsList", participantsList);

			for (Map<String, Object> participant : newParticipantsToInsert) {
				String participantId = (String) participant.get("key"); // 또는 item.key
				String participantUrl = SURVEY_DOMAIN+"/survey/article/?my="
					+ participantId
					+ "&surveyCode=" + surveyCode;

				participant.put("url", participantUrl);
			}

			// 새 참가자는 생성 알림을 즉시 보냄
			if (!newParticipantsToInsert.isEmpty()) {
				Map<String, Object> insertParams = new HashMap<>(data);
				insertParams.put("participantsList", newParticipantsToInsert);
				surveyMapper.registParticipants(insertParams);
//				alertSurvey(insertParams, false);
			}


			for (Map<String, Object> participant : participantsList) {
				String participantId = (String) participant.get("key");
				String participantUrl = SURVEY_DOMAIN+"/survey/article/?my="
					+ participantId
					+ "&surveyCode=" + surveyCode;

				participant.put("url", participantUrl);
			}
			Map<String, Object> writer = new HashMap<>();
			writer.put("key", userId);
			String selfUrl = SURVEY_DOMAIN+"/survey/article/?my="
				+ userId + "&surveyCode=" + surveyCode;
			writer.put("url", selfUrl);
			participantsList.add(writer);

			formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
			String startDatetimeStr=(String)data.get("startDatetime");
			LocalDateTime startDatetime = LocalDateTime.parse(startDatetimeStr, formatter);
			if (startDatetime.isBefore(now)) {
				startDatetime = now.plusMinutes(1);
			}
			String startDatetimeAlarmStr=startDatetime.format(alarmFormatter);

			//시작알림등록
			alarmData.put("subject", "미니투표"+data.get("surveyTitle") + "이 생성되었습니다.");
			alarmData.put("content", "미니투표"+data.get("surveyTitle") + "이 생성되었습니다.");
			alarmData.put("before10m", "1");
			alarmData.put("pushTime", startDatetimeAlarmStr);
			if (!newParticipantsToInsert.isEmpty()) {
				alarmData.put("participantsList", newParticipantsToInsert);
				surveyMapper.registEndAlarm(alarmData);
			}


			alarmData.put("participantsList", participantsList);
			//10분전 알림 등록
			alarmData.put("pushTime", tenMinutesBeforeEndAlarmStr);
			alarmData.put("subject", "미니투표 " + data.get("surveyTitle") + " 마감 10분전입니다.");
			alarmData.put("content", "미니투표 " + data.get("surveyTitle") + " 마감 10분전입니다.");
			alarmData.put("before10m", "1");
			if(now.isBefore(tenMinutesBeforeEnd)) {
				surveyMapper.registEndAlarm(alarmData);
			}

			alarmData.put("pushTime", endDatetimeAlarmStr);
			alarmData.put("subject", "미니투표 " + data.get("surveyTitle") + "이 종료되었습니다.");
			alarmData.put("content", "미니투표 " + data.get("surveyTitle") + "이 종료되었습니다.");
			alarmData.put("before10m", "0");
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
		Survey survey = surveyMapper.survey(data);
		log.info("submitSurvey survey: {}", survey);

		LocalDateTime now = LocalDateTime.now();
		ZoneId zone = ZoneId.systemDefault();

		// Date → LocalDateTime 변환
		LocalDateTime startDatetime = survey.getStartDatetime().toInstant().atZone(zone).toLocalDateTime();
		LocalDateTime endDatetime   = survey.getEndDatetime().toInstant().atZone(zone).toLocalDateTime();
		if (now.isBefore(startDatetime)) {
			throw new IllegalStateException("아직 투표가 시작되지 않았습니다.");
		}
		if (now.isAfter(endDatetime)) {
			throw new IllegalStateException("이미 마감된 투표입니다.");
		}


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

	@Value("${messenger.host}")
	private String host;

	@Value("${messenger.port}")
	private int port;

	@Value("${messenger.channel}")
	private int channel;

	@Transactional
	public void alertSurvey(Map<String, Object> data, boolean isFirstRegister) throws Exception {
		List<Map<String, Object>> participantsList = (List<Map<String, Object>>) data.get("participantsList");
		String surveyTitle = (String) data.get("surveyTitle");
		String userId = (String) data.get("userId");
		String sndName = organizationMapper.memberById(userId).getUserName();
		String surveyCode = (String) data.get("surveyCode");
		String message = "미니투표 '" + surveyTitle + "'이 생성되었습니다.";
		String selfUrl = SURVEY_DOMAIN+"/survey/article/?my="
			+ userId + "&surveyCode=" + surveyCode;

		Set<String> notified = new HashSet<>();


		for (Map<String, Object> map : participantsList) {
			AtMessengerCommunicator atmc = new AtMessengerCommunicator(host, port, channel);
			String member = (String) map.get("key");
			if (notified.add(member)) { // 중복된 대상은 무시
				String participantUrl = SURVEY_DOMAIN+"/survey/article/?my="
					+ member + "&surveyCode=" + surveyCode;
				atmc.addMessage(member, userId, message, participantUrl, message, "12345");
			}
			atmc.send();
		}
		if (isFirstRegister && notified.add(userId)) {
			AtMessengerCommunicator atmc = new AtMessengerCommunicator(host, port, channel);
			atmc.addMessage(userId, userId, message, selfUrl, message, "12345");
			atmc.send();
		}

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