package com.ultari.additional.service;

import java.time.LocalDateTime;
import java.util.*;

import com.ultari.additional.mapper.common.AlertMapper;
import com.ultari.additional.mapper.common.OrganizationMapper;
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
		List<Survey> mobileList = surveyMapper.surveyListMobile(data);
		
		for (Survey survey : mobileList) {
			collectAdditionalInformation(survey, userId);
		}
		
		Map<String, Object> map = new HashMap<>();
		map.put("list", list);
		map.put("mobileList", mobileList);
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
	}
	
	public Map<String, Object> survey(Map<String, Object> data) throws Exception {
		String userId = (String) data.get("userId");
		
		Survey survey = surveyMapper.survey(data);
		List<SurveyQuestion> surveyQuestionList = surveyMapper.surveyQuestionList(data);
		//20250707 KHJ
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
		surveyMapper.registParticipants(data);
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

		log.debug(surveyTitle+" "+userId);

		for(Map<String, Object> map : participantsList) {
			log.debug((String) map.get("key"));
			String member = (String) map.get("key");

			alertMapper.registAlert(userId, surveyTitle, surveyCode, StringUtil.castNowDate(LocalDateTime.now(),"yyyyMMddHHmmss"), member, sndName, "SURVEY", "0");
		}
	}
	
	private void collectAdditionalInformation(Survey survey, String userId) {
		List<SurveyMember> memberList = survey.getMemberList();
		String isMember = "N";
		String isDone = "N";
		for (SurveyMember member : memberList) {
			String key = member.getKey();
			if (key.equals(userId)) {
				isMember = "Y";
				isDone = member.getIsComplete();
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
		List<SurveyQuestion> surveyQuestionList = surveyMapper.surveyQuestionListWithoutItems(map);
		List<SurveyItem> surveyItemList = surveyMapper.surveyItemListBySurveyCode(map);
		List<SurveyResult> surveyResult = surveyMapper.surveyResultBySurveyCode(map);
		List<SurveyMember> surveyMemberList = surveyMapper.surveyMemberList(map);
		
		SurveyStatistics statistics = new SurveyStatistics(surveyQuestionList, surveyItemList, surveyResult, surveyMemberList);
		Map<String, Object> statisticsIndividualSelectionQuestions = statistics.individualSelectionQuestions();
		Map<String, Object> statisticsByItem = statistics.statisticsByItem();
		
		List<Map<String, Object>> list = new ArrayList<>();
		list.add(statisticsByItem);
		list.add(statisticsIndividualSelectionQuestions);
		
		Map<String, Object> data = new HashMap<>();
		data.put(ExcelConstant.FILE_NAME, "미니투표_" + StringUtil.datetime("yyyyMMddHHmmss"));
		data.put("data", list);
		data.put(ExcelConstant.TYPE, "survey");
		
		return data;
	}
}
