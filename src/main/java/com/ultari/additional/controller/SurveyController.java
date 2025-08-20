package com.ultari.additional.controller;

import com.ultari.additional.domain.organization.BuddyRequest;
import com.ultari.additional.domain.survey.BuddySurveyMember;
import com.ultari.additional.domain.survey.SurveyMember;
import com.ultari.additional.util.AmCodec;
import com.ultari.additional.util.AtMessengerCommunicator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpSession;

import com.ultari.additional.domain.account.TokenData;
import com.ultari.additional.service.AccountService;
import com.ultari.additional.util.CryptorManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import com.ultari.additional.domain.account.Account;
import com.ultari.additional.domain.survey.Survey;
import com.ultari.additional.domain.survey.SurveyResult;
import com.ultari.additional.domain.survey.SurveyResultDesc;
import com.ultari.additional.excel.constant.ExcelConstant;
import com.ultari.additional.excel.view.XlsxView;
import com.ultari.additional.service.SurveyService;
import com.ultari.additional.util.PageManager;
import com.ultari.additional.util.StringUtil;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Slf4j
@RequestMapping("/survey")
@Controller
public class SurveyController {

	@Autowired
	SurveyService surveyService;

	@Autowired
	AccountService accountService;

	@Autowired
	private XlsxView xlsxView;

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

	@SuppressWarnings("unchecked")
	@RequestMapping("/")
	public String list(@RequestParam(value = "pageNo", defaultValue = "1") int pageNo,
		@RequestParam(value = "keyword", defaultValue = "") String keyword,
		Model model,
		HttpSession session) throws Exception {
		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();

		log.info(key);

		Map<String, Object> data = new HashMap<>();
		data.put("userId", key);
		data.put("keyword", keyword);
		data.put("pageNo", pageNo);

		Map<String, Object> map = surveyService.surveyList(data);
		List<Survey> list = (List<Survey>) map.get("list");
		List<Survey> mobileList = (List<Survey>) map.get("mobileList");
		PageManager pageManager = (PageManager) map.get("pageManager");

		model.addAttribute("list", list);
		model.addAttribute("mobileList", mobileList);
		model.addAttribute("paging", pageManager);
		model.addAttribute("keyword", keyword);

		return "survey/list";
	}

	@GetMapping("/regist")
	public String registForm(HttpSession session) throws Exception {
		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();

		log.info(key);

		return "survey/regist";
	}



	// JSON 요청 처리
	@PostMapping(value = "/regist/buddy", consumes = MediaType.APPLICATION_JSON_VALUE)
	public String registFormJson(
		@RequestBody BuddyRequest req,
		HttpSession session,
		Model model
	) throws Exception {
		return doRegistBuddy(req.getMy(), req.getBuddyId(), session, model);
	}

	// Form 요청 처리
	@PostMapping(value = "/regist/buddy", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
	public String registFormForm(
		@RequestParam String my,
		@RequestParam String buddyId,
		HttpSession session,
		Model model
	) throws Exception {
		return doRegistBuddy(my, buddyId, session, model);
	}

	// 공통 처리 메서드
	private String doRegistBuddy(String my, String buddyId, HttpSession session, Model model) throws Exception {
		// 1. SSO 인증
		Account account = (Account) session.getAttribute("account");
		if (account == null) {
			account = accountService.memberByKey(my);
			if (account == null) {
				return "redirect:/invalid";
			}
			session.setAttribute("account", account);
		}
		String key = account.getKey();

		// 2. 기존 로직
		log.info("Account Key: {}", key);
		log.info("my={}, buddyid={}", my, buddyId);

		model.addAttribute("my", my);

		Map<String, Object> map = new HashMap<>();
		map.put("key", key);
		map.put("buddyId", buddyId);

		List<BuddySurveyMember> surveyMembers = surveyService.getMembersByBuddyId(map);
		log.info("조회된 surveyMembers 수: {}", surveyMembers.size());
		for (BuddySurveyMember member : surveyMembers) {
			log.info("SurveyMember - userName: {}", member.getTitle());
			log.info("SurveyMember - userId: {}", member.getUserId());
		}
		model.addAttribute("surveyMembers", surveyMembers);

		return "survey/regist";
	}

	@PostMapping("/registSurvey")
	@ResponseBody
	public Map<String, Object> registSurvey(@RequestBody Map<String, Object> data, HttpSession session) throws Exception {
		String code = "ok";
		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();

		log.info(key);

		data.put("userId", key);
		data.put("initUser", 1);

		try {
			surveyService.registSurvey(data);
		} catch(Exception e) {
			log.error("", e);
			code = "fail";
		}

		Map<String, Object> map = new HashMap<>();
		map.put("code", code);

		return map;
	}

	@GetMapping("/article/{surveyCode}")
	public String articleForm(@PathVariable String surveyCode, HttpSession session, Model model) throws Exception {
		Account account = (Account) session.getAttribute("account");
		String userId = account.getKey();

		log.info(userId);

		Map<String, Object> data = new HashMap<>();
		data.put("surveyCode", surveyCode);
		data.put("userId", userId);

		Map<String, Object> map = surveyService.survey(data);

		model.addAttribute("survey", map.get("survey"));
		model.addAttribute("surveyQuestionList", map.get("surveyQuestionList"));
		model.addAttribute("surveyResult", map.get("surveyResult"));
		model.addAttribute("surveyItemAggregate", map.get("surveyItemAggregate"));

		return "survey/article";
	}

	@PostMapping(value="/article", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
	public String alarmArticle(@RequestParam("surveyCode") String surveyCode,
		@RequestParam("my") String my,
		HttpSession session,
		Model model) throws Exception {
		Account account = (Account) session.getAttribute("account");
		if (account == null) {
			account = accountService.memberByKey(my);
			if (account == null) {
				return "redirect:/invalid";
			}
			session.setAttribute("account", account);
		}
		return "redirect:/survey/article/" + surveyCode;
	}

	@PostMapping("/saveSurvey")
	@ResponseBody
	public Map<String, Object> saveSurvey(@RequestBody Map<String, Object> data, HttpSession session) throws Exception {
		String code = "ok";
		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();
		data.put("userId", key);
		data.put("initUser", 0);

		String surveyCode = (String) data.get("surveyCode");
		String surveyTitle = (String) data.get("surveyTitle");

		log.info("userId=" + key + ", surveyCode=" + surveyCode + ", surveyTitle=" + surveyTitle);

		try {
			surveyService.saveSurvey(data);
		} catch(Exception e) {
			log.error("", e);
			code = "fail";
		}

		Map<String, Object> map = new HashMap<>();
		map.put("code", code);
		map.put("surveyTitle", surveyTitle);
		map.put("surveyContents", (String) data.get("surveyContents"));
		map.put("startDatetime", (String) data.get("startDatetime"));
		map.put("endDatetime", (String) data.get("endDatetime"));
		map.put("participantsList", data.get("participantsList"));

		return map;
	}

	@PostMapping("/removeSurvey")
	@ResponseBody
	public Map<String, Object> removeSurvey(@RequestBody Map<String, Object> data, HttpSession session) throws Exception {
		String code = "ok";

		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();
		String surveyCode = (String) data.get("surveyCode");
		String surveyTitle = (String) data.get("surveyTitle");

		log.info("userId=" + key + ", surveyCode=" + surveyCode + ", surveyTitle=" + surveyTitle);

		try {
			surveyService.removeSurvey(data);
		} catch(Exception e) {
			log.error("", e);
			code = "fail";
		}

		Map<String, Object> map = new HashMap<>();
		map.put("code", code);

		return map;
	}

	@PostMapping("/submitSurvey")
	@ResponseBody
	public Map<String, Object> submitSurvey(@RequestBody Map<String, Object> data, HttpSession session) throws Exception {
		String code = "ok";
		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();
		String surveyCode = (String) data.get("surveyCode");
		data.put("userId", key);

		log.info("userId=" + key + ", surveyCode=" + surveyCode);

		try {
			surveyService.submitSurvey(data);
		} catch(Exception e) {
			log.error("", e);
			code = "fail";
		}

		Map<String, Object> map = new HashMap<>();
		map.put("code", code);

		return map;
	}

	@PostMapping("/surveyItemResultMember")
	@ResponseBody
	public Map<String, Object> surveyItemResultMember(@RequestBody Map<String, Object> data, HttpSession session) throws Exception {
		String code = "ok";
		Account account = (Account) session.getAttribute("account");
		String key = account.getKey();
		data.put("userId", key);

		List<SurveyResult> list = null;

		try {
			list = surveyService.surveyItemResultMember(data);
		} catch(Exception e) {
			log.error("", e);
			code = "fail";
		}

		Map<String, Object> map = new HashMap<>();
		map.put("code", code);
		map.put("list", list);

		return map;
	}

	@RequestMapping("/exportDesc")
	public ModelAndView exportDesc(@RequestParam("surveyCode") String surveyCode,
		HttpSession session) {
		Map<String, Object> map = new HashMap<>();
		map.put("surveyCode", surveyCode);

		Map<String, Object> data;
		try {
			List<SurveyResultDesc> list = surveyService.surveyResultDesc(map);
			data = transFormatSurveyDescData(list);
		} catch (Exception e) {
			log.error("", e);
			data = new HashMap<>();
		}
		return new ModelAndView(xlsxView, data);
	}

	private Map<String, Object> transFormatSurveyDescData(List<SurveyResultDesc> list) {
		List<List<String>> survey = new ArrayList<List<String>>();
		Map<String, Object> map = new HashMap<>();
		map.put(ExcelConstant.FILE_NAME, "survey_" + StringUtil.datetime("yyyyMMddHHmmss"));
		map.put(ExcelConstant.HEAD, Arrays.asList("질문", "항목", "내용", "이름", "부서"));
		map.put(ExcelConstant.BODY, survey);

		for (SurveyResultDesc result : list) {
			String questionContents = result.getQuestionContents();
			String itemContents = result.getItemContents();
			String desc = result.getDesc();
			String userName = result.getUserName();
			String deptName = result.getDeptName();

			List<String> item = new ArrayList<>();
			item.add(questionContents);
			item.add(itemContents);
			item.add(desc);
			item.add(userName);
			item.add(deptName);

			survey.add(item);
		}

		return map;
	}

	@PostMapping("/noti")
	@ResponseBody
	private Map<String, Object> noti(@RequestBody Map<String, Object> data, HttpSession session) throws Exception {
		Map<String, Object> map = surveyService.noti(data);
		return map;
	}

	@RequestMapping("/export")
	public ModelAndView export(@RequestParam String surveyCode, HttpSession session) throws Exception {
		Map<String, Object> data = new HashMap<>();
		data.put("surveyCode", surveyCode);

		Map<String, Object> map = surveyService.export(data);
		log.debug(map.toString());
		return new ModelAndView(xlsxView, map);
	}

	@PostMapping("/notitest")
	@ResponseBody
	public String helloWorld(
		HttpSession session,
		Model model) throws Exception {
		Account account = (Account) session.getAttribute("account");
		if (account == null) {
			account = accountService.memberByKey("ultari01");
			if (account == null) {
				return "redirect:/invalid";
			}
			session.setAttribute("account", account);
		}
		return "Hello World";
	}

}
