package com.ultari.additional.domain.account;

import lombok.Data;

@Data
public class TokenData {
	private String key;
	private String systemCode;
	private String ip;
	private String datetime;
	private String surveyCode;
}
