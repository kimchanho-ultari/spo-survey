package com.ultari.additional.controller;

import com.ultari.additional.domain.account.Account;
import com.ultari.additional.domain.organization.Buddy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpSession;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import com.ultari.additional.domain.organization.Dept;
import com.ultari.additional.domain.organization.User;
import com.ultari.additional.excel.view.XlsxView;
import com.ultari.additional.service.MigrationService;
import com.ultari.additional.service.OrganizationService;
import com.ultari.additional.service.PasswordService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequestMapping("/organization")
@Controller
public class OrganizationController {
	@Autowired
	OrganizationService organizationService;
	@Autowired
	MigrationService migrationService;
	
	@Autowired
	PasswordService passwordService;
	
	@Autowired
	private XlsxView xlsxView;
	
	@PostMapping("/deptListByPid")
	@ResponseBody
	public List<Dept> deptListByPid(@RequestParam(value="key", defaultValue="") String key) throws Exception {
		Map<String, Object> map = new HashMap<>();
		map.put("key", key);
		return organizationService.deptListByPid(map);
	}
	@PostMapping("/buddyListByPid")
	@ResponseBody
	public List<Buddy> buddyListByPid(@RequestParam(value="key", defaultValue="") String key, HttpSession session) throws Exception {
		Account account = (Account) session.getAttribute("account");
		String userId = account.getKey(); // 세션에서 userId 꺼내기
		log.debug("userId: " + userId);
		Map<String, Object> map = new HashMap<>();
		map.put("key", key);
		map.put("userId", userId);
		return organizationService.buddyListByPid(map);
	}
	@PostMapping("/memberByDeptIdPaging")
	@ResponseBody
	public Map<String, Object> memberByDeptIdPaging(@RequestBody Map<String, Object> data) throws Exception {
		return organizationService.memberByDeptIdPaging(data);
	}
	@PostMapping("/memberByDeptId")
	@ResponseBody
	public List<User> memberByDeptId(@RequestBody Map<String, Object> data) throws Exception {
		return organizationService.memberByDeptId(data);
	}
	@PostMapping("/memberByBuddyId")
	@ResponseBody
	public List<User> memberByBuddyId(@RequestParam(value="key") String key, HttpSession session) throws Exception {
		Account account = (Account) session.getAttribute("account");
		String userId = account.getKey();
		Map<String, Object> map = new HashMap<>();
		log.debug(key);
		map.put("key",key);
		map.put("userId", userId);
		return organizationService.memberByBuddyId(map);
	}
	@PostMapping("/memberByKeyword")
	@ResponseBody
	public List<User> memberByKeyword(@RequestBody Map<String, Object> data) throws Exception {
		return organizationService.memberByKeyword(data);
	}
	@PostMapping("/memberByKeywordPaging")
	@ResponseBody
	public Map<String, Object> memberByKeywordPaging(@RequestBody Map<String, Object> data) throws Exception {
		return organizationService.memberByKeywordPaging(data);
	}
	@PostMapping("/registMember")
	@ResponseBody
	public Map<String, Object> registMember(User user) throws Exception {
		log.info("called");
		Map<String, Object> map = organizationService.registMember(user);
		return map;
	}
	@PostMapping("/modifyMember")
	@ResponseBody
	public Map<String, Object> modifyMember(User user) throws Exception {
		log.info("called");
		Map<String, Object> map = organizationService.modifyMember(user);
		return map;
	}
	@PostMapping("/resetPassword")
	@ResponseBody
	public Map<String, Object> resetPassword(@RequestBody Map<String, Object> map) throws Exception {
		log.info("called");
		return passwordService.reset(map);
	}
	@PostMapping("/removeMember")
	@ResponseBody
	public Map<String, Object> removeMember(@RequestBody Map<String, Object> data) throws Exception {
		log.info("called");
		return organizationService.removeMember(data);
	}
	@PostMapping("/resetFailedPasswordCount")
	@ResponseBody
	public Map<String, Object> resetFailedPasswordCount(@RequestBody Map<String, Object> data) throws Exception {
		log.info("called");
		return organizationService.resetFailedPasswordCount(data);
	}
	@PostMapping("/moveMember")
	@ResponseBody
	public Map<String, Object> moveMember(@RequestBody Map<String, Object> data) throws Exception {
		log.info("called");
		return organizationService.moveMember(data);
	}
	@GetMapping("/exportMember/{key}")
	public ModelAndView exportMember(@PathVariable("key") String key) throws Exception {
		Map<String, Object> data = organizationService.exportMember(key);
		return new ModelAndView(xlsxView, data);
	}
	@PostMapping("/migration")
	@ResponseBody
	public Map<String, Object> migration(@RequestBody Map<String, Object> data) throws Exception {
		return migrationService.migration();
	}
	@PostMapping("/syncOrg")
	@ResponseBody
	public Map<String, Object> syncOrg(@RequestBody Map<String, Object> data) throws Exception {
		log.debug("called");
		return organizationService.syncOrg();
	}

	@PostMapping("/buddy")
	@ResponseBody
	public String buddyList(@RequestParam String buddyParent, @RequestParam String userId) throws Exception {
		JSONObject json = organizationService.buddyList(userId, buddyParent);
		log.debug(json.toString());
		return json.toString();
	}
}
