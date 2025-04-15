package com.ultari.additional.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.ultari.additional.mapper.common.PasswordMapper;
import com.ultari.additional.util.ApiManager;
import com.ultari.additional.util.CryptorManager;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PasswordService {
	@Autowired
	PasswordMapper passwordMapper;
	
	@Autowired
	ApiManager apiManager;
	
	@Value("${common.account.encrypt.driver}")
	private String CRYPT_DRIVER;
	@Value("${common.account.encrypt.method}")
	private String CRYPT_METHOD;
	@Value("${common.account.encrypt.use-wrapping-base64}")
	private boolean USE_WRAPPING_BASE64;
	
	public Map<String, Object> regist(Map<String, Object> map) throws Exception {
		Map<String, Object> data = new HashMap<>();
		String code = "ok";
		
		String password = (String) map.get("password");
		password = CryptorManager.crypt(password, CRYPT_DRIVER, CRYPT_METHOD, false, USE_WRAPPING_BASE64);
		map.replace("password", password);
		
		String newPassword = (String) map.get("newPassword");
		newPassword = CryptorManager.crypt(newPassword, CRYPT_DRIVER, CRYPT_METHOD, false, USE_WRAPPING_BASE64);
		map.replace("newPassword", newPassword);
		
		try {
			code = checkPassword(map);
			log.debug("result=" + code);
			if (code.equals("same")) {
				passwordMapper.regist(map);
				
				StringBuilder sb = new StringBuilder();
				sb.append("ModifyPassword\t");
				sb.append(map.get("key")).append("\t");
				sb.append(map.get("newPassword")).append("\f");
				
				apiManager.send(sb.toString());
				
				code = "ok";
			}
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		data.put("code", code);
		
		return data;
	}
	public Map<String, Object> reset(Map<String, Object> map) throws Exception {
		String code = "ok";
		String key = (String) map.get("key");
		
		try {
			passwordMapper.remove(map);
			
			StringBuilder sb = new StringBuilder();
			sb.append("ModifyPassword\t");
			sb.append(key).append("\t");
			sb.append(key).append("\f");
			
			apiManager.send(sb.toString());
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		Map<String, Object> data = new HashMap<>();		
		data.put("code", code);
		
		return data;
	}
	public String checkPassword(Map<String, Object> map) throws Exception {
		String code = "fail";
		
		try {
			String password = (String) map.get("password");
			String storedPassword = passwordMapper.passwordByKey(map);
			
			code = password.equals(storedPassword) ? "same" : "different";
		} catch(Exception e) {
			log.error("", e);
		}
		
		return code;
	}
}
