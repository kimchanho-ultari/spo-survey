package com.ultari.additional.domain.survey;

import lombok.Data;

@Data
public class SurveyResultDesc {
	private String questionContents;
	private String itemCode;
	private String itemContents;
	private String userId;
	private String userName;
	private String deptName;
	private String desc;
}