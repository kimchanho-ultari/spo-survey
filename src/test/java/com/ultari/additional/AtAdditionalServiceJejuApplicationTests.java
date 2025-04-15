package com.ultari.additional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.ultari.additional.service.SurveyService;
import com.ultari.additional.util.StringUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@SpringBootTest
class AtAdditionalServiceJejuApplicationTests {
	
	@Autowired
	SurveyService surveyService;

	@Test
	void contextLoads() {
	}
	
	@Test
	void test() {
		
	}
	
	//@Test
	void dummyData() throws Exception {
		for (int i = 1; i < 1000; i++) {
			String surveyCode = StringUtil.uuid();
			String surveyTitle = "테스트" + StringUtil.lpad(i, 3, "0");
			String surveyContents = "성실 답변 부탁합니다.";
			String startDatetime = "2020-05-06 09:00:00";
			String endDatetime = "2020-05-31 18:00:00";
			String userId = "eVFZS1diWVdlZ1AvcEtRYXBWck1HUT09";
			
			Map<String, Object> survey = new HashMap<>();
			survey.put("surveyCode", surveyCode);
			survey.put("surveyTitle", surveyTitle);
			survey.put("surveyContents", surveyContents);
			survey.put("startDatetime", startDatetime);
			survey.put("endDatetime", endDatetime);
			survey.put("userId", userId);
			
			
			survey.put("participantsList", participants());
			survey.put("questionList", questions());
			
			log.debug(survey.toString());
			
			surveyService.registSurvey(survey);
		}
	}

	private List<Map<String, Object>> questions() {
		List<Map<String, Object>> list = new ArrayList<>();
		
		for (int i = 1; i <= 3; i++) {
			String contents = "질문00" + i;
			String isMulti = "N";
			String isAnonymous = "N";
			
			Map<String, Object> question = new HashMap<>();
			question.put("questionContents", contents);
			question.put("isMulti", isMulti);
			question.put("isAnonymous", isAnonymous);
			question.put("questionItem", questionItems());
			
			list.add(question);
		}
		
		return list;
	}
	
	private List<Map<String, Object>> questionItems() {
		List<Map<String, Object>> list = new ArrayList<>();
		
		for (int i = 1; i <= 3; i++) {
			String contents = "항목00" + i;
			String type = "N";
			int num = i;
			
			Map<String, Object> item = new HashMap<>();
			item.put("itemContents", contents);
			item.put("itemType", type);
			item.put("num", num);
			
			list.add(item);
		}
		
		return list;
	}
	
	private List<Map<String, Object>> participants() {
		List<Map<String, Object>> participantsList = new ArrayList<>();
		Map<String, Object> participants1 = new HashMap<>();
		participants1.put("key", "T1hGVzZFMnZmeUM1ZFVsOG1HRmZxUT09");
		participants1.put("title", "테스트000");
		participants1.put("deptName", "테스트부서");
		participants1.put("posName", "");
		
		Map<String, Object> participants2 = new HashMap<>();
		participants2.put("key", "OWFjVURSQVcrai9GMkRiS0xkSmtqdz09");
		participants2.put("title", "테스트001");
		participants2.put("deptName", "테스트부서");
		participants2.put("posName", "");
		
		participantsList.add(participants1);
		participantsList.add(participants2);
		
		return participantsList;
	}
}
