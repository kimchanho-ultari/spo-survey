package com.ultari.additional.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.ultari.additional.interceptor.SessionInterceptor;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
	@Autowired
	SessionInterceptor interceptor;
	
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(interceptor)
				.addPathPatterns("/**")
				.excludePathPatterns("/css/**")
				.excludePathPatterns("/js/**")
				.excludePathPatterns("/images/**")
				.excludePathPatterns("/fonts/**")
				.excludePathPatterns("/survey/**")
				.excludePathPatterns("/ssa/**")
				.excludePathPatterns("/redirect/**")
				.excludePathPatterns("/adm/login")
				.excludePathPatterns("/adm/account")
				.excludePathPatterns("/invalid");
	}
}