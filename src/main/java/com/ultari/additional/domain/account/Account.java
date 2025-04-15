package com.ultari.additional.domain.account;

import lombok.Data;

@Data
public class Account {
	private String key;
	private String title;
	private String password;
	private String deptId;
	private String deptName;
	private String phone;
	private String mobile;
	private String email;
	private String role;
	
	private String decKey;
}
