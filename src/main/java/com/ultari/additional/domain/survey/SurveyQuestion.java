package com.ultari.additional.domain.survey;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class SurveyQuestion {
	private String questionCode;
	private String questionContents;
	private String isMulti;
	private String isAnonymous;
	private String surveyCode;
	private String questionNumber;
	
	private List<SurveyItem> itemList;
	
	public void init() {
		if (itemList == null) {
			itemList = new ArrayList<>();
		}
	}
	
	public void addItem(SurveyItem item) {
		itemList.add(item);
	}
}