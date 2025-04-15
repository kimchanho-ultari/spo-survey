package com.ultari.additional.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultari.additional.domain.organization.Dept;
import com.ultari.additional.domain.organization.User;
import com.ultari.additional.excel.constant.ExcelConstant;
import com.ultari.additional.mapper.common.OrganizationMapper;
import com.ultari.additional.util.ApiManager;
import com.ultari.additional.util.CryptorManager;
import com.ultari.additional.util.PageManager;
import com.ultari.additional.util.StringUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class OrganizationService {
	@Autowired
	OrganizationMapper organizationMapper;
	
	@Autowired
	ApiManager apiManager;
	
	@Autowired
	private RestTemplate restTemplate;
	
	@Value("${common.account.encrypt.driver}")
	private String CRYPT_DRIVER;
	@Value("${common.account.encrypt.method}")
	private String ENCRYPT_METHOD;
	@Value("${common.account.decrypt.method}")
	private String DECRYPT_METHOD;
	@Value("${common.account.encrypt.use-wrapping-base64}")
	private boolean USE_WRAPPING_BASE64;
	
	@Value("${common.organization.top-dept-id}")
	private String TOP_DEPT_ID;
	
	@Value("${rest-template.org-sync-url}")
	private String REST_TEMPLATE_ORG_SYNC_URL;
	
	public List<Dept> deptListByPid(Map<String, Object> map) throws Exception {
		return organizationMapper.deptListByPid(map);
	}
	public List<User> memberByDeptId(Map<String, Object> map) throws Exception {
		List<User> list = organizationMapper.memberByDeptId(map);
		return list;
	}
	public List<User> memberByKeyword(Map<String, Object> map) throws Exception {
		List<User> list = organizationMapper.memberByKeyword(map);
		return list;
	}
	private void setDecryptUserId(List<User> list) throws Exception {
		for (User usr : list) {
			String decUserId = usr.getUserId();
			decUserId = CryptorManager.crypt(decUserId, CRYPT_DRIVER, DECRYPT_METHOD, false, USE_WRAPPING_BASE64);
			
			usr.setDecUserId(decUserId);
		}
	}
	public Map<String, Object> memberByDeptIdPaging(Map<String, Object> map) throws Exception {
		int pageNo = (int)map.get("pageNo");
		int totalCnt = organizationMapper.totalCntForMemberByDeptId(map);
		
		PageManager pageManager = new PageManager();
		pageManager.setPageNo(pageNo);
		pageManager.setPageBlock(10);
		pageManager.setPageSize(15);
		pageManager.setTotalCount(totalCnt);
		pageManager.makePaging();
		
		map.put("startRowNo", pageManager.getStartRowNo());
		map.put("pageSize", pageManager.getPageSize());
		
		List<User> list = organizationMapper.memberByDeptIdPaging(map);
		setDecryptUserId(list);
		map.put("list", list);
		map.put("pageManager", pageManager);
		
		return map;
	}
	public Map<String, Object> memberByKeywordPaging(Map<String, Object> map) throws Exception {
		int pageNo = (int)map.get("pageNo");
		int totalCnt = organizationMapper.totalCntForMemberByKeyword(map);
		
		PageManager pageManager = new PageManager();
		pageManager.setPageNo(pageNo);
		pageManager.setPageBlock(10);
		pageManager.setPageSize(15);
		pageManager.setTotalCount(totalCnt);
		pageManager.makePaging();
		
		map.put("startRowNo", pageManager.getStartRowNo());
		map.put("pageSize", pageManager.getPageSize());
		
		List<User> list = organizationMapper.memberByKeywordPaging(map);
		setDecryptUserId(list);
		
		map.put("list", list);
		map.put("pageManager", pageManager);
		
		return map;
	}
	
	public Map<String, Object> registMember(User user) throws Exception {
		Map<String, Object> map = new HashMap<>();
		String code = "ok";
		
		String userId = user.getUserId();
		userId = CryptorManager.crypt(userId, CRYPT_DRIVER, ENCRYPT_METHOD, false, USE_WRAPPING_BASE64);
		
		User u = organizationMapper.memberById(userId);
		
		if (u == null) {
			try {
				user.setUserId(userId);
				user.setPassword(userId);
				
				organizationMapper.registMember(user);
				
				userInfoToMessengerServer("RegistMember", userId);
			} catch(Exception e) {
				code = "fail";
				log.error("", e);
			}
		} else {
			code = "overlaps";
		}
		
		map.put("code", code);
		return map;
	}
	
	public Map<String, Object> modifyMember(User user) throws Exception {
		Map<String, Object> map = new HashMap<>();
		String code = "ok";
		try {
			organizationMapper.modifyMember(user);
			
			userInfoToMessengerServer("ModifyMember", user.getUserId());
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		map.put("code", code);
		return map;
	}
	
	private void userInfoToMessengerServer(String command, String userId) {
		User usr = null;
		try {
			usr = organizationMapper.memberById(userId);
		} catch (Exception e) {
			log.error("User information inquiry error: " + userId, e);
		}
		
		if (usr != null) {
			ObjectMapper objectMapper = new ObjectMapper();
			String result = null;
			try {
				result = objectMapper.writeValueAsString(usr);
			} catch (JsonProcessingException e) {
				log.error("Error changing user information format: " + userId, e);
			}
			
			if (result != null) {
				StringBuilder sb = new StringBuilder();
				sb.append(command).append("\t").append(result).append("\f");
				log.debug(sb.toString());
				try {
					apiManager.send(sb.toString());
					log.info("Successful message delivery to the messenger server: " + userId);
				} catch (Exception e) {
					log.error("Message delivery to the Messenger Server failed: " + command, e);
				}
			}
		}
	}
	
	@SuppressWarnings("unchecked")
	public Map<String, Object> removeMember(Map<String, Object> map) throws Exception {
		String code = "ok";
		try {
			List<Map<String, String>> list = (List<Map<String, String>>) map.get("list");
			organizationMapper.removeMember(map);
			
			for (Map<String, String> obj : list) {
				String key = obj.get("key");
				StringBuilder sb = new StringBuilder();
				sb.append("RemoveMember\t").append(key).append("\f");
	
				apiManager.send(sb.toString());
			}
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		Map<String, Object> data = new HashMap<>();
		data.put("code", code);
		return data;
	}
	
	public Map<String, Object> resetFailedPasswordCount(Map<String, Object> map) {
		String code = "ok";
		try {
			String key = (String) map.get("key");
			organizationMapper.resetFailedPasswordCount(key);
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		Map<String, Object> data = new HashMap<>();
		data.put("code", code);
		return data;
	}
	
	@SuppressWarnings("unchecked")
	public Map<String, Object> moveMember(Map<String, Object> map) throws Exception {
		String code = "ok";
		try {
			List<Map<String, String>> list = (List<Map<String, String>>) map.get("list");
			organizationMapper.moveMember(map);
			
			try {
				for (Map<String, String> item : list) {
					String userId = (String) item.get("key");
					userInfoToMessengerServer("ModifyMember", userId);
				}
			} catch (Exception e) {
				log.error("", e);
			}
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		Map<String, Object> data = new HashMap<>();
		data.put("code", code);
		return data;
	}
	
	public Map<String, Object> exportMember(String key) throws Exception {
		Map<String, Object> data;
		
		try {
			if (key.equals(TOP_DEPT_ID)) {
				List<User> list = organizationMapper.memberAll();
				setDecryptUserId(list);
				data = transFormExportMember(list);
			} else {
				List<Dept> deptList = organizationMapper.deptListAll();
				
				List<String> keys = new ArrayList<String>();
				keys.add(key);
				
				subDept(key, deptList, keys);
				
				log.debug(keys.toString());
				Map<String, Object> map = new HashMap<>();
				map.put("list", keys);
				
				List<User> list = organizationMapper.memberByDeptIdList(map);
				setDecryptUserId(list);
				data = transFormExportMember(list);
			}
		} catch(Exception e) {
			data = new HashMap<>();
			log.error("", e);
		}
		
		
		return data;
	}

	private void subDept(String key, List<Dept> deptList, List<String> keys) throws Exception {
		for (Dept dept : deptList) {
			String pId = dept.getPId();
			if (pId.equals(key)) {
				String id = dept.getKey();
				keys.add(id);
				subDept(id, deptList, keys);
			}
		}
	}
	
	private Map<String, Object> transFormExportMember(List<User> list) throws Exception {
		List<List<String>> member = new ArrayList<>();
		Map<String, Object> map = new HashMap<>();
		map.put(ExcelConstant.FILE_NAME, "user_" + StringUtil.datetime("yyyyMMddHHmmss"));
		map.put(ExcelConstant.HEAD, Arrays.asList("아이디", "이름", "직위", "내선번호", "휴대번호", "이메일", "부서명"));
		map.put(ExcelConstant.BODY, member);
		map.put(ExcelConstant.TYPE, "org");
		
		for (User user : list) {
			String userId = user.getDecUserId();
			String userName = user.getUserName();
			String posName = user.getPosName();
			String phone = user.getPhone();
			String mobile = user.getMobile();
			String email = user.getEmail();
			String deptName = user.getDeptName();
			
			List<String> item = new ArrayList<>();
			item.add(userId);
			item.add(userName);
			item.add(posName);
			item.add(phone);
			item.add(mobile);
			item.add(email);
			item.add(deptName);
			
			member.add(item);
		}
		
		return map;
	}
	
	public Map<String, Object> syncOrg() throws Exception {
		Map<String, Object> data = new HashMap<>();
		String code = "ok";
		
		try {
			String result = restTemplate.getForObject(REST_TEMPLATE_ORG_SYNC_URL, String.class);
			code = result.equals("OK") ? "ok" : "fail";
		} catch(Exception e) {
			code = "fail";
			log.error("", e);
		}
		
		data.put("code", code);
		return data;
	}
}
