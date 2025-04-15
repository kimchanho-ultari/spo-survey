package com.ultari.additional.controller;

import java.util.Map;

import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ultari.additional.domain.account.Account;
import com.ultari.additional.service.PasswordService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequestMapping("/password")
@Controller
public class PasswordController {
	@Autowired
	PasswordService passwordService;
	
	@GetMapping("/")
	public String registForm(Model model) throws Exception {
		return "password/regist";
	}
	@PostMapping("/regist")
	@ResponseBody
	public Map<String, Object> regist(@RequestBody Map<String, Object> data,
			HttpSession session) throws Exception {
		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();

		log.info("called: " + key);
		data.put("key", key);
		
		return passwordService.regist(data);
	}
}
