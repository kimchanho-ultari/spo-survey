package com.ultari.additional.domain.survey;

import lombok.Data;

@Data
public class SurveyMember {
	private String key;
	private String title;
	private String deptName;
	private String isComplete;
	private String surveyCode;
	private String userId;
	private String parentOrg;
	private String posName;
	private boolean initUser;
}
