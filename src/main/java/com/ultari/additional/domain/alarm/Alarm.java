package com.ultari.additional.domain.alarm;

import lombok.Data;

@Data
public class Alarm {
	private String msgId; //받는사람
	private String id; //보내는 사람
	private String pushTime; //알림을 받을 시간
	private String subject; // 제목
	private String content; // 내용
	private String url;
	private String status;
	private String rtype;
	private String begint;
	private String endt;
	private String groupId;
	private String surveyId; //투표 pk
}
