package com.ultari.additional.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.ultari.additional.domain.survey.SurveyItem;
import com.ultari.additional.domain.survey.SurveyMember;
import com.ultari.additional.domain.survey.SurveyQuestion;
import com.ultari.additional.domain.survey.SurveyResult;
import com.ultari.additional.excel.constant.ExcelConstant;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class SurveyStatistics {
	private List<SurveyQuestion> surveyQuestionList;
	private List<SurveyItem> surveyItemList;
	private List<SurveyResult> surveyResult;
	private List<SurveyMember> surveyMemberList;
	
	public SurveyStatistics(List<SurveyQuestion> surveyQuestionList, 
							List<SurveyItem> surveyItemList, 
							List<SurveyResult> surveyResult,
							List<SurveyMember> surveyMemberList) {
		this.surveyQuestionList = surveyQuestionList;
		this.surveyItemList = surveyItemList;
		this.surveyResult = surveyResult;
		this.surveyMemberList = surveyMemberList;
	}
	
	private List<SurveyQuestion> questionList() {
		List<SurveyQuestion> questionList = new ArrayList<>();
		for (SurveyQuestion question : surveyQuestionList) {
			SurveyQuestion q = new SurveyQuestion();
			q.setQuestionCode(question.getQuestionCode());
			q.setQuestionContents(question.getQuestionContents());
			q.setSurveyCode(question.getSurveyCode());
			q.setIsMulti(question.getIsMulti());
			q.setIsAnonymous(question.getIsAnonymous());
			q.setQuestionNumber(question.getQuestionNumber());
			
			questionList.add(q);
		}
		return questionList;
	}
	
	private List<SurveyItem> itemList() {
		List<SurveyItem> itemList = new ArrayList<>();
		for (SurveyItem item : surveyItemList) {
			SurveyItem sItem = new SurveyItem();
			sItem.setItemCode(item.getItemCode());
			sItem.setItemType(item.getItemType());
			sItem.setItemContents(item.getItemContents());
			sItem.setQuestionCode(item.getQuestionCode());
			sItem.setItemNumber(item.getItemNumber());
			itemList.add(sItem);
		}
		
		return itemList;
	}
	
	/*
	 * 항목별 통계
	 * */
	public Map<String, Object> statisticsByItem() {
		Map<String, Object> data = new HashMap<>();
		List<SurveyQuestion> questionList = questionList();
		List<SurveyItem> itemList = itemList();
		
		List<Integer> mark = new ArrayList<>();
		List<String> header = new ArrayList<>();
		header.add("설문 결과 정리");
		
		for (SurveyResult result : surveyResult) {
			String itemCode = result.getItemCode();
			String itemType = result.getItemType();
			String userId = result.getUserId();
			String desc = result.getDesc();
			
			for (SurveyItem item : itemList) {
				String iCode = item.getItemCode();
				
				if (iCode.equals(itemCode)) {
					if (itemType.equals("DESC")) item.addDesc(desc);
					else item.addUser(userId);
				}
			}
		}
		
		for (SurveyItem item : itemList) {
			String questionCode = item.getQuestionCode();
			for (SurveyQuestion question : questionList) {
				
				String qCode = question.getQuestionCode();
				
				if (questionCode.equals(qCode)) {
					question.init();
					question.addItem(item);
				}
			}
		}
		List<List<String>> body = new ArrayList<>();
		List<String> empty = new ArrayList<>();
		body.add(empty);
		StringBuilder sb = new StringBuilder();
		for (SurveyQuestion q : questionList) {
			log.debug(q.toString());
			List<String> bodyItem = new ArrayList<>();
			sb.append("[항목 ").append(q.getQuestionNumber()).append("]");
			bodyItem.add(sb.toString());
			bodyItem.add("");
			bodyItem.add("");
			sb.delete(0, sb.length());
			
			sb.append(q.getQuestionContents());
			/*
			String isMulti = q.getIsMulti();
			if (isMulti.equals("Y")) {
				sb.append(" [중복선택]");
			}
			*/
			List<String> bodyItem2 = new ArrayList<>();
			bodyItem2.add(sb.toString());
			bodyItem2.add("");
			bodyItem2.add("");
			
			body.add(bodyItem);
			body.add(bodyItem2);
			
			//log.debug(body.size() + " " + body.get(body.size() -1));
			mark.add(body.size() -1);
			
			List<SurveyItem> surveyItemList = q.getItemList();
			int total = 0;
			for (SurveyItem item : surveyItemList) {
				int len = item.getUserList().size();
				total += len;
			}
			for (SurveyItem item : surveyItemList) {
				String type = item.getItemType();
				if (type.equals("DESC")) {
					body.addAll(descList(item));
				} else {
					body.add(item(item, total));
				}
			}
			
			if (total > 0) {
				List<String> totalItem = new ArrayList<>();
				totalItem.add("총합계");
				totalItem.add(total + "");
				totalItem.add("100%");
				body.add(totalItem);
				mark.add(body.size() -1);
			}
			
			body.add(empty);
			
			total = 0;
			sb.delete(0, sb.length());
		}
		
		data.put(ExcelConstant.HEAD, header);
		data.put(ExcelConstant.BODY, body);
		data.put(ExcelConstant.MARK, mark);
		data.put(ExcelConstant.SHEET_NAME, "항목별 통계");
		
		return data;
	}
	private List<String> item(SurveyItem item, int total) {
		List<String> tmp = new ArrayList<>();
		String itemNumber = item.getItemNumber();
		String contents = item.getItemContents();
		int len = item.getUserList().size();
		
		StringBuilder sb = new StringBuilder();
		sb.append(itemNumber).append(". ").append(contents);
		
		tmp.add(sb.toString());
		tmp.add(len + "");
		tmp.add(((double)len / (double)total * 100) + "%");
		return tmp;
	}
	private List<List<String>> descList(SurveyItem item) {
		List<List<String>> list = new ArrayList<>();
		List<String> descList = item.getDesc();
		StringBuilder sb = new StringBuilder();
		for (int i = 0, len = descList.size(); i < len; i++) {
			List<String> tmp = new ArrayList<>();
			String desc = descList.get(i);
			sb.append(i + 1).append(". ").append(desc);
			tmp.add(sb.toString());
			tmp.add("");
			tmp.add("");
			list.add(tmp);
			
			sb.delete(0, sb.length());
		}
		return list;
	}
	/*
	 * 개인별 선택 문항
	 * */
	public Map<String, Object> individualSelectionQuestions() {
		List<Map<String, Object>> list = new ArrayList<>();
		Map<String, Object> data = new HashMap<>();
		
		List<Integer> mark = new ArrayList<>();
		List<String> header = new ArrayList<>();
		header.add("설문지 응답 현황");
		
		List<List<String>> body = new ArrayList<>();
		List<String> empty = new ArrayList<>();
		body.add(empty);
		
		StringBuilder sb = new StringBuilder();
		List<String> qList = new ArrayList<>();
		
		List<SurveyQuestion> questionList = questionList();
		List<SurveyMember> memberList = memberOrderAdjustment();
		
		for (SurveyQuestion question : questionList) {
			sb.append("[문항 ").append(question.getQuestionNumber()).append("]");
			qList.add(sb.toString());
			
			sb.delete(0, sb.length());
		}
		
		body.add(qList);
		mark.add(body.size() -1);
		
		for (SurveyMember member : memberList) {
			String key = member.getKey();
			
			if (member.getIsComplete().equals("Y")) {
				Map<String, Object> answer = new HashMap<>();
				answer.put("userId", key);
				
				List<String> item = new ArrayList<>();
				for (SurveyQuestion question : questionList) {
					String questionCode = question.getQuestionCode();
					String questionNumber = question.getQuestionNumber();
					StringBuilder a = new StringBuilder();
					
					for (SurveyResult result : surveyResult) {
						String userId = result.getUserId();
						String qCode = result.getQuestionCode();
						String type = result.getItemType();
						if (questionCode.equals(qCode) && key.equals(userId)) {
							if (type.equals("DESC")) {
								a.append(result.getDesc());
							} else {
								String num = result.getItemNumber();
								a.append(num).append(",");
							}
						}
					}
					
					int len = a.length();
					int pos = a.lastIndexOf(",");
					String val = a.lastIndexOf(",") > -1 && pos == len - 1 ? a.substring(0, a.length() - 1) : a.toString();
					answer.put(questionNumber, val);
					item.add(val);
					
					a.delete(0, a.length());
				}
				list.add(answer);
				body.add(item);
			}
		}
		
		data.put(ExcelConstant.HEAD, header);
		data.put(ExcelConstant.BODY, body);
		data.put(ExcelConstant.MARK, mark);
		data.put(ExcelConstant.SHEET_NAME, "개인별 선택 문항 확인");
		return data;
	}
	
	private List<SurveyMember> memberOrderAdjustment() {
		List<SurveyMember> list = new ArrayList<>();
		List<SurveyMember> tmp = new ArrayList<>();
				
		for (SurveyMember member : surveyMemberList) {
			if (!list.contains(member)) list.add(member);
			String key = member.getKey();
			if (member.getIsComplete().equals("Y")) {
				for (SurveyResult result : surveyResult) {
					String userId = result.getUserId();
					if (key.equals(userId)) {
						String type = result.getItemType();
						if (type.equals("DESC")) {
							if (!tmp.contains(member)) {
								tmp.add(member);
								list.remove(member);
								continue;
							}
							
						}
					}
				}
			}
		}
		
		list.addAll(tmp);
		return list;
	}
}
