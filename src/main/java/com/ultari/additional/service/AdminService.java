package com.ultari.additional.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.ultari.additional.mapper.common.AdminMapper;
import com.ultari.additional.util.CryptorManager;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AdminService {
	@Autowired
	AdminMapper adminMapper;
	
	@Value("${common.account.encrypt.driver}")
	private String CRYPT_DRIVER;
	@Value("${common.account.encrypt.method}")
	private String CRYPT_METHOD;
	@Value("${common.account.encrypt.use-wrapping-base64}")
	private boolean USE_WRAPPING_BASE64;
	
	public Map<String, Object> regist(Map<String, Object> map) throws Exception {
		String code = "ok";
		
		String password = (String) map.get("password");
		password = CryptorManager.crypt(password, CRYPT_DRIVER, CRYPT_METHOD, false, USE_WRAPPING_BASE64);
		map.replace("password", password);
		
		try {
			adminMapper.regist(map);
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		Map<String, Object> data = new HashMap<>();
		data.put("code", code);
		
		return data;
	}
}
