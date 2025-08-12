package com.ultari.additional.controller;

import com.ultari.additional.domain.account.Account;
import com.ultari.additional.domain.account.SsoRequest;
import com.ultari.additional.domain.account.TokenData;
import com.ultari.additional.service.AccountService;
import com.ultari.additional.util.AuthenticationTokenManager;
import com.ultari.additional.util.CryptorManager;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Slf4j
@Controller
public class AccountController {
	@Autowired
	AccountService accountService;

	@Value("${common.account.encrypt.use:true}")
	private boolean USE_CRYPT;
	@Value("${common.account.encrypt.driver}")
	private String CRYPT_DRIVER;
	@Value("${common.account.encrypt.method}")
	private String ENCRYPT_METHOD;
	@Value("${common.account.decrypt.method}")
	private String DECRYPT_METHOD;
	@Value("${common.account.encrypt.use-wrapping-base64}")
	private boolean USE_WRAPPING_BASE64;

	@PostMapping(path="/sso", consumes="application/json")
	public String sso1(@RequestBody SsoRequest req,
		HttpSession session, @Nullable String surveyCode) throws Exception {
		String systemCode = req.getSystemCode();
		String key = req.getKey();
		log.debug("systemCode=" + systemCode + ", key=" + key);
		log.debug("USE_CRYPT=" + USE_CRYPT);
		String userId = key;
		if (USE_CRYPT) {
			userId = CryptorManager.crypt(key, CRYPT_DRIVER, ENCRYPT_METHOD, false, USE_WRAPPING_BASE64);
		}
		log.debug("userId=" + userId);

		TokenData tokenData = new TokenData();
		tokenData.setKey(userId);
		tokenData.setSystemCode(systemCode);
		tokenData.setSurveyCode(surveyCode);

		Map<String, Object> map = accountInfo(tokenData);
		Account account = (Account) map.get("account");
		String uri = (String) map.get("uri");
		if (!uri.contains("invalid")) {
			account.setDecKey(key);
			session.setAttribute("account", account);
		}

		return uri;
	}

	 @GetMapping("/{systemCode:^(?!css|js|images|static$).*$}/{key}")
	public String sso(@PathVariable("systemCode") String systemCode,
			@PathVariable("key") String key,
			RedirectAttributes attr,
			HttpSession session, @Nullable String surveyCode,HttpServletRequest request) throws Exception {

		request.getQueryString();
		request.getParameter("surveyCode");
		log.debug("systemCode=" + systemCode + ", key=" + key);
		log.debug("USE_CRYPT=" + USE_CRYPT);
		String userId = key;
		if (USE_CRYPT) {
			userId = CryptorManager.crypt(key, CRYPT_DRIVER, ENCRYPT_METHOD, false, USE_WRAPPING_BASE64);
		}
		log.debug("userId=" + userId);

		TokenData tokenData = new TokenData();
		tokenData.setKey(userId);
		tokenData.setSystemCode(systemCode);
		tokenData.setSurveyCode(surveyCode);

		Map<String, Object> map = accountInfo(tokenData);
		Account account = (Account) map.get("account");
		String uri = (String) map.get("uri");
		if (!uri.contains("invalid")) {
			account.setDecKey(key);
			session.setAttribute("account", account);
		}

		return uri;
	}

	@RequestMapping("/ssa/{token}")
	public String ssa(@PathVariable("token") String token,
			RedirectAttributes attr,
			HttpServletRequest request,
			HttpSession session) throws Exception {
		String uri = "redirect:/invalid";

		try {
			TokenData tokenData = AuthenticationTokenManager.tokenData(token);
			boolean validation = AuthenticationTokenManager.validation(tokenData);
			log.debug("validation=" + validation);

			if (validation) {
				String userId = "";
				try {
					userId = CryptorManager.crypt(tokenData.getKey(), CRYPT_DRIVER, DECRYPT_METHOD, false,
							USE_WRAPPING_BASE64);
				} catch (Exception e) {
					userId = tokenData.getKey();
					log.error("", e);
				}

				log.info(userId);
				Map<String, Object> map = accountInfo(tokenData);
				Account account = (Account) map.get("account");
				uri = (String) map.get("uri");
				if (!uri.contains("invalid")) {
					account.setDecKey(userId);
					session.setAttribute("account", account);
				}
			}
		} catch (Exception e) {
			uri = "redirect:/invalid";
		}

		return uri;
	}

	@RequestMapping("/redirect/{key}")
	public String redirect(@PathVariable("key") String key,
			@RequestParam("redirect") String redirect,
			HttpSession session) throws Exception {

		TokenData tokenData = new TokenData();
		tokenData.setKey(key);
		tokenData.setSystemCode(redirect);

		Map<String, Object> map = accountInfo(tokenData);
		Account account = (Account) map.get("account");
		String uri = (String) map.get("uri");
		if (!uri.contains("invalid")) {
			account.setDecKey(key);
			session.setAttribute("account", account);
		}

		return uri;
	}

	private Map<String, Object> accountInfo(TokenData tokenData) {
		Map<String, Object> map = new HashMap<>();
		StringBuilder sb = new StringBuilder();
		sb.append("redirect:/");

		Account account = null;

		try {
			String key = tokenData.getKey();
			account = accountService.memberByKey(key);
			if (account != null) {
				String systemCode = tokenData.getSystemCode();
				String surveyCode = tokenData.getSurveyCode();
				sb.append(systemCode).append("/");
				if (systemCode.equals("adm")) {
					sb.append("organization");
				} else {
					if (surveyCode != null) {
						sb.append("article").append("/").append(surveyCode);
					}
				}
			} else {
				sb.append("invalid");
				log.info("User not found: " + key);
			}
		} catch (Exception e) {
			log.error("", e);
			sb.append("invalid");
		}

		map.put("uri", sb.toString());
		map.put("account", account);

		return map;
	}

	@GetMapping("/invalid")
	public void invalid() throws Exception {
		log.debug("called");
	}

	@GetMapping("/logout")
	private String logout(HttpSession session) throws Exception {
		Account account = (Account) session.getAttribute("account");
		if (account != null) {
			log.info("called " + account.getKey());
		} else {
			log.info("called: key is not valid");
		}

		String uri = "redirect:/adm/login";
		session.invalidate();
		return uri;
	}

	@PostMapping("/adm/account")
	@ResponseBody
	private Map<String, Object> login(@RequestBody Map<String, Object> data,
			HttpSession session) throws Exception {
		String userId = (String) data.get("userId");
		String password = (String) data.get("password");

		log.info(userId);

		if (USE_CRYPT) {
			userId = CryptorManager.crypt(userId, CRYPT_DRIVER, ENCRYPT_METHOD, false, USE_WRAPPING_BASE64);
			password = CryptorManager.crypt(password, CRYPT_DRIVER, ENCRYPT_METHOD, false, USE_WRAPPING_BASE64);
		}

		Account account = accountService.managerByKey(userId);
		Map<String, Object> map = new HashMap<>();
		String code = "LOGIN";
		if (account == null) {
			code = "NOT_EXIST";
		} else {
			if (!password.equals(account.getPassword())) {
				code = "PASSWORD_MISMATCH";
			} else {
				session.setAttribute("account", account);
			}
		}

		map.put("code", code);
		return map;
	}
}
