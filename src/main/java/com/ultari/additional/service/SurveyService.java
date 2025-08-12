package com.ultari.additional.service;

import com.ultari.additional.util.AtMessengerCommunicator;
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

	@Transactional(rollbackFor = Exception.class)
	public void registSurvey(Map<String, Object> data) throws Exception {
		transSurvey(data);

		if (data.containsKey("type")) {
			surveyMapper.removeQuestions(data);
			surveyMapper.removeItems(data);
		}

		surveyMapper.registSurvey(data);
		surveyMapper.registParticipants(data);
		surveyMapper.registQuestions(data);
		surveyMapper.registQuestionsItems(data);

		alertSurvey(data);

		// 마감 알림 등록 로직 추가
		if (data.containsKey("endDatetime")) {
			// 마감 시간 String을 LocalDateTime으로 변환
			String endDatetimeStr = (String) data.get("endDatetime");
			DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd H:mm:ss");
			LocalDateTime endDatetime = LocalDateTime.parse(endDatetimeStr, formatter);

			// 마감 5분 전 알림 시간 계산
			LocalDateTime fiveMinutesBeforeEnd = endDatetime.minusMinutes(10);

			// 'YYYYMMDDHHmm' 형식의 문자열로 변환
			DateTimeFormatter alarmFormatter = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
			String fiveMinutesBeforeEndAlarmStr = fiveMinutesBeforeEnd.format(alarmFormatter);
			String endDatetimeAlarmStr = endDatetime.format(alarmFormatter);

			// 참가자 리스트 가져오기
			List<Map<String, String>> participantsList = (List<Map<String, String>>) data.get("participantsList");

			// 마감 알림을 위한 데이터 맵 생성 및 등록
			Map<String, Object> alarmData = new HashMap<>();
			alarmData.put("surveyId", data.get("surveyCode"));
			alarmData.put("id", data.get("userId")); // 보내는 사람 (설문 생성자)
			alarmData.put("subject", "미니투표 "+data.get("surveyTitle") +" 마감 10분전입니다." );
			alarmData.put("content", "미니투표 "+data.get("surveyTitle") +" 마감 10분전입니다." );

			// 1. 마감 5분 전 알림 등록
			alarmData.put("pushTime", fiveMinutesBeforeEndAlarmStr);
			alarmData.put("participantsList", participantsList);
			surveyMapper.registEndAlarm(alarmData);

			// 2. 마감 즉시 알림 등록
			alarmData.put("pushTime", endDatetimeAlarmStr);
			alarmData.put("subject", "미니투표 "+data.get("surveyTitle") +"이 종료되었습니다." );
			alarmData.put("content", "미니투표 "+data.get("surveyTitle") +"이 종료되었습니다." );
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

		if (!newParticipantsToInsert.isEmpty()) {
			Map<String, Object> insertParams = new HashMap<>(data);
			insertParams.put("participantsList", newParticipantsToInsert);
			surveyMapper.registParticipants(insertParams);
			alertSurvey(insertParams);

			// 알림 추가 로직 추가
			if (data.containsKey("endDatetime")) {
				// 마감 시간 String을 LocalDateTime으로 변환
				String endDatetimeStr = (String) data.get("endDatetime");
				DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd H:mm:ss");
				LocalDateTime endDatetime = LocalDateTime.parse(endDatetimeStr, formatter);

				// 마감 10분 전 알림 시간 계산
				LocalDateTime tenMinutesBeforeEnd = endDatetime.minusMinutes(10);

				// 'YYYYMMDDHHmm' 형식의 문자열로 변환
				DateTimeFormatter alarmFormatter = DateTimeFormatter.ofPattern("yyyyMMddHHmm");
				String tenMinutesBeforeEndAlarmStr = tenMinutesBeforeEnd.format(alarmFormatter);
				String endDatetimeAlarmStr = endDatetime.format(alarmFormatter);

				// 알림 등록을 위한 데이터 맵 생성 및 등록
				Map<String, Object> alarmData = new HashMap<>();
				alarmData.put("surveyId", surveyCode);
				alarmData.put("id", data.get("userId")); // 보내는 사람 (설문 생성자)

				// 1. 마감 10분 전 알림 등록
				alarmData.put("pushTime", tenMinutesBeforeEndAlarmStr);
				alarmData.put("subject", "미니투표 "+data.get("surveyTitle") +" 마감 10분전입니다." );
				alarmData.put("content", "미니투표 "+data.get("surveyTitle") +" 마감 10분전입니다." );
				alarmData.put("participantsList", newParticipantsToInsert); // 새 참가자 리스트만 전달
				surveyMapper.registEndAlarm(alarmData);

				// 2. 마감 즉시 알림 등록
				alarmData.put("pushTime", endDatetimeAlarmStr);
				alarmData.put("subject", "미니투표 "+data.get("surveyTitle") +"이 종료되었습니다." );
				alarmData.put("content", "미니투표 "+data.get("surveyTitle") +"이 종료되었습니다." );
				surveyMapper.registEndAlarm(alarmData);
			}
		}
	}

	public void removeSurvey(Map<String, Object> data) throws Exception {
		surveyMapper.removeSurvey(data);
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
	public void alertSurvey(Map<String, Object> data) throws Exception {
		List<Map<String, Object>> participantsList = (List<Map<String, Object>>) data.get("participantsList");
		String surveyTitle = (String) data.get("surveyTitle");
		String userId = (String) data.get("userId");
		String sndName = organizationMapper.memberById(userId).getUserName();
		String surveyCode = (String) data.get("surveyCode");

//		log.debug(surveyTitle+" "+userId);
//
//		for(Map<String, Object> map : participantsList) {
//			log.debug((String) map.get("key"));
//			String member = (String) map.get("key");
//
//			alertMapper.registAlert(userId, surveyTitle, surveyCode, StringUtil.castNowDate(LocalDateTime.now(),"yyyyMMddHHmmss"), member, sndName, "SURVEY", "0");
//		}
		AtMessengerCommunicator atmc = new AtMessengerCommunicator("10.0.0.177", 1234, 1); //이부분 spo에 맞춰서 build해야함.
		for(Map<String, Object> map : participantsList) {
			String member = (String) map.get("key");
			String message = "미니투표 '" + surveyTitle + "'이 생성되었습니다.";
			atmc.addMessage(member,  userId, message,"www.ultari.co.kr",message,"12345");
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


	public List<SurveyMember> getMembersByBuddyId(Map<String, Object> map) {
		return surveyMapper.MemberListByBuddyId(map);
	}
}
