package com.ultari.additional.interceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import com.ultari.additional.domain.account.Account;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class SessionInterceptor extends HandlerInterceptorAdapter {

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		boolean b = true;
		HttpSession session = request.getSession();
		Account account = (Account) session.getAttribute("account");
		String contextPath = request.getRequestURI();
		String page = "/invalid";


		String myParam = request.getParameter("my");
		if (myParam != null && !myParam.isEmpty()) {
			return true;
		}
		if (request.getRequestURI().equals("/sso")) {
			return true; // SSO 요청은 세션 검사 패스
		}
		if (account == null) {
			if (isAjaxRequest(request)) {
				response.sendError(400);
			} else {
				if (contextPath.startsWith("/adm")) {
					log.debug("login");
					page = "/adm/login";
				}

				response.sendRedirect(page);
			}

			b = false;
		} else {
			if (contextPath.startsWith("/adm")) {
				String role = account.getRole();
				if (!role.equals("MANAGER")) {
					page = "/adm/login";
					request.getSession().invalidate();
					response.sendRedirect(page);
				}
			}
		}

		return b;
	}

	private boolean isAjaxRequest(HttpServletRequest request) {
		String header = request.getHeader("AJAX");
		boolean isAjaxRequest = false;
		if (header!= null && header.equals("true")) {
			isAjaxRequest = true;
		}

		return isAjaxRequest;
	}
}