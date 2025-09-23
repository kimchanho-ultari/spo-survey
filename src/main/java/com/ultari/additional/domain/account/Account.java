package com.ultari.additional.domain.account;

import java.io.Serializable;
import lombok.Data;

@Data
public class Account implements Serializable {
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
