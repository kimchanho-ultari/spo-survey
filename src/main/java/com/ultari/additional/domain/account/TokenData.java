package com.ultari.additional.domain.account;

import java.io.Serializable;
import lombok.Data;

@Data
public class TokenData implements Serializable {
	private String key;
	private String systemCode;
	private String ip;
	private String datetime;
	private String surveyCode;
}
