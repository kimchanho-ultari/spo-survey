package com.ultari.additional.domain.survey;

import java.util.Date;

import lombok.Data;

@Data
public class SurveyResult {
	private String itemCode;
	private String userId;
	private String userName;
	private String deptName;
	private String desc;
	private String itemType;
	private String questionCode;
	private String itemNumber;
	private Date datetime;
}