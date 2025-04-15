package com.ultari.additional.config;

import org.apache.http.client.HttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/*
 * 타 시스템에 Rest요청
 * */
@Configuration
public class RestfulConfig {
	@Value("${rest-template.factory.read-timeout}")
	private int READ_TIMEOUT;
	@Value("${rest-template.factory.connect-timeout}")
	private int CONNECT_TIMEOUT;
	@Value("${rest-template.http-client.max-conn-total}")
	private int MAX_CONN_TOTAL;
	@Value("${rest-template.http-client.max-conn-per-route}")
	private int MAX_CONN_PER_ROUTE;
	
	@Bean
	public RestTemplate restTemplate() {
		HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
		factory.setReadTimeout(READ_TIMEOUT);
		factory.setConnectTimeout(CONNECT_TIMEOUT);
		
		HttpClient httpClient = HttpClientBuilder.create()
				.setMaxConnTotal(MAX_CONN_TOTAL)
				.setMaxConnPerRoute(MAX_CONN_PER_ROUTE)
				.build();
		
		factory.setHttpClient(httpClient);
		RestTemplate restTemplate = new RestTemplate(factory);

		return restTemplate;
	}
}
