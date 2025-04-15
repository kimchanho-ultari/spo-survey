package com.ultari.additional.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ultari.additional.domain.migration.Group;
import com.ultari.additional.domain.migration.Member;
import com.ultari.additional.mapper.migration.from.FromMapper;
import com.ultari.additional.mapper.migration.to.ToMapper;
import com.ultari.additional.util.CryptorManager;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Transactional
@Service
public class MigrationService {
	@Autowired
	FromMapper fromMapper;
	@Autowired
	ToMapper toMapper;
	
	@Value("${common.account.encrypt.driver}")
	private String CRYPT_DRIVER;
	@Value("${common.account.encrypt.method}")
	private String ENCRYPT_METHOD;
	@Value("${common.account.decrypt.method}")
	private String DECRYPT_METHOD;
	@Value("${common.account.encrypt.use-wrapping-base64}")
	private boolean USE_WRAPPING_BASE64;
	
	public Map<String, Object> migration() throws Exception {
		String code = "ok";
		
		try {
			List<Group> deptList = fromMapper.deptList();
			List<Member> memberList = fromMapper.memberList();
			
			toMapper.removeDept();
			toMapper.registDept(deptList);
			toMapper.removeMember();
			
			log.info("dept size=" + deptList.size());
			log.info("user size=" + memberList.size());
			
			for (Member member : memberList) {
				String key = CryptorManager.crypt(member.getKey(), CRYPT_DRIVER, ENCRYPT_METHOD, false, USE_WRAPPING_BASE64);
				
				member.setKey(key);
				member.setPassword(key);
				
				log.debug(member.toString());
				toMapper.registMember(member);
			}
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		
		Map<String, Object> data = new HashMap<>();
		data.put("code", code);
		return data;
	}
}
