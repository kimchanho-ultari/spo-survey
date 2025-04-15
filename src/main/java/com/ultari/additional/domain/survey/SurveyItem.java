package com.ultari.additional.domain.survey;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class SurveyItem {
	private String itemCode;
	private String itemContents;
	private String itemType;
	private String questionCode;
	private String itemNumber;
	
	// for Statistics
	private List<String> userList = new ArrayList<>();
	private List<String> desc = new ArrayList<>();
	
	public void addUser(String str) {
		userList.add(str);
	}
	public void addDesc(String str) {
		desc.add(str);
	}
}