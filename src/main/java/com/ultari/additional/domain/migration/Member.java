package com.ultari.additional.domain.migration;

import lombok.Data;

@Data
public class Member {
	private String key;
	private String title;
	private String deptId;
	private String phone;
	private String posName;
	private String mobile;
	private String email;
	private int sort;
	private String job;
	private String password;
}
