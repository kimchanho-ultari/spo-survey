package com.ultari.additional.controller;

import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ultari.additional.domain.account.Account;
import com.ultari.additional.service.AdminService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequestMapping("/adm")
@Controller
public class AdminController {
	@Autowired
	AdminService adminService;
	
	@GetMapping("/organization")
	public String organization() throws Exception {
		log.info("called");
		return "adm/organization";
	}
	@GetMapping("/password")
	public String password() throws Exception {
		log.info("called");
		return "adm/password";
	}
	
	@GetMapping("/login")
	public String loginForm() throws Exception {
		log.info("called");
		return "adm/login";
	}
	
	@PostMapping("/password")
	@ResponseBody
	public Map<String, Object> registPassword(@RequestBody Map<String, Object> map,
			HttpSession session) throws Exception {
		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();
		map.put("key", key);
		log.info("called: " + key);
		return adminService.regist(map);
	}
}
