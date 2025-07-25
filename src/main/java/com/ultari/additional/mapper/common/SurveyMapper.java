package com.ultari.additional.mapper.common;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.ultari.additional.domain.survey.Aggregate;
import com.ultari.additional.domain.survey.Survey;
import com.ultari.additional.domain.survey.SurveyItem;
import com.ultari.additional.domain.survey.SurveyMember;
import com.ultari.additional.domain.survey.SurveyQuestion;
import com.ultari.additional.domain.survey.SurveyResult;
import com.ultari.additional.domain.survey.SurveyResultDesc;

@Mapper
public interface SurveyMapper {
	public void registSurvey(Map<String, Object> data) throws Exception;
	public void registParticipants(Map<String, Object> data) throws Exception;
	public void registQuestions(Map<String, Object> data) throws Exception;
	public void registQuestionsItems(Map<String, Object> data) throws Exception;
	
	public void saveSurvey(Map<String, Object> data) throws Exception;
	public void removeSurvey(Map<String, Object> data) throws Exception;
	
	public void submitSurvey(Map<String, Object> data) throws Exception;
	public void submitSurveyDesc(Map<String, Object> data) throws Exception;
	public void submitSurveyMember(Map<String, Object> data) throws Exception;
	
	public int numberOfList(Map<String, Object> data) throws Exception;
	public List<Survey> surveyList(Map<String, Object> data) throws Exception;
	public List<Survey> surveyListMobile(Map<String, Object> data) throws Exception;
	
	public Survey survey(Map<String, Object> data) throws Exception;
	public List<SurveyMember> surveyMemberList(Map<String, Object> data) throws Exception;
	public List<SurveyQuestion> surveyQuestionList(Map<String, Object> data) throws Exception;
	public List<SurveyMember> MemberListByBuddyId(String buddyId);

	public List<SurveyResult> surveyResult(Map<String, Object> data) throws Exception;
	public List<Aggregate> surveyItemAggregate(Map<String, Object> data) throws Exception;
	public List<SurveyResultDesc> surveyResultDesc(Map<String, Object> data) throws Exception;
	
	public List<SurveyResult> surveyItemResultMember(Map<String, Object> data) throws Exception;
	
	public List<String> surveyMemberIdUncompleteBySurveyCode(Map<String, Object> data) throws Exception;
	
	public void removeQuestions(Map<String, Object> data) throws Exception;
	public void removeItems(Map<String, Object> data) throws Exception;
	
	public List<SurveyQuestion> surveyQuestionListWithoutItems(Map<String, Object> data) throws Exception;
	public List<SurveyItem> surveyItemListBySurveyCode(Map<String, Object> data) throws Exception;
	public List<SurveyResult> surveyResultBySurveyCode(Map<String, Object> data) throws Exception;

	void savePicture(String itemCode, String filePath);

	List<String> findDeleteSurveyList(String deleteDays);

	void deleteSurvey(String surveyCode);
	void deleteSurveyItem(String surveyCode);
	void deleteSurveyMember(String surveyCode);
	void deleteSurveyQuestion(String surveyCode);
	void deleteSurveyResult(String surveyCode);
	void deleteSurveyResultDesc(String surveyCode);
	void deleteOldSurveys();
	void deleteParticipants(Map<String, Object> deleteParams);

	public List<String> selectParticipantUserIds(String surveyCode);

}