package com.ultari.additional.domain.organization;

import lombok.Data;

@Data
public class User {
	private String userId;
	private String userName;
	private String deptId;
	private String deptName;
	private String posName;
	private String phone;
	private String mobile;
	private String email;
	private String password;
	private String sort;
	private String type;
	
	private String decUserId;
}
