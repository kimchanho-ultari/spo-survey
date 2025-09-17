package com.ultari.additional.domain.survey;

import java.util.Date;
import java.util.List;

import lombok.Data;

@Data
public class Survey {
	private String surveyCode;
	private String surveyTitle;
	private String surveyContents;
	private Date regDatetime;
	private Date startDatetime;
	private Date endDatetime;	
	private String status;						// 설문 상태 (완료: C, 진행중: P, 대기중: W)
	private String userId;
	private String userName;
	
	private String isMember;					// 설문 참여자 여부
	private String isDone;						// (본인이) 설문을 했는지 여부
	private String isWriter;					// (본인이) 설문 작성자인지 여부
	
	private String isOpen;						// 설문 공개 여부 (Y/N)
	private String endAlarm;                    // 종료알람 여부
	
	private int totalComplete;					// 설문 완료자 수 
	
	private List<SurveyMember> memberList;
}
