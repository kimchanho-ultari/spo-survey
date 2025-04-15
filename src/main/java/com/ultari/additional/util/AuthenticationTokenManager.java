package com.ultari.additional.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultari.additional.domain.account.TokenData;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class AuthenticationTokenManager {
	private static final String CRYPT_DRIVER = "kr.co.ultari.cryptor.seed.Codec";
	private static final String CRYPT_METHOD = "decrypt";
	
	public static TokenData tokenData(String str) throws Exception {
		
		String tokenInfo = CryptorManager.crypt(str, CRYPT_DRIVER, CRYPT_METHOD, false, true);
		ObjectMapper objectMapper = new ObjectMapper();
		TokenData tokenData = objectMapper.readValue(tokenInfo, TokenData.class);
		return tokenData;
	}
	
	public static boolean validation(TokenData tokenData) throws Exception {
		String datetime = tokenData.getDatetime();
		boolean result = false;
		if (validateDateTime(datetime)) {
			result = true;
		}
		
		return result;
	}
	
	private static boolean validateDateTime(String datetime) throws Exception {
		LocalDateTime currentDateTime = LocalDateTime.now();
		LocalDateTime targetDateTime = localDateTimeByString(datetime);
		
		long between = ChronoUnit.SECONDS.between(currentDateTime, targetDateTime);
		between = Math.abs(between);
		log.debug("currentDateTime=" + dateTimeFormat(currentDateTime, "yyyy-MM-dd HH:mm:ss") + ", targetDateTime=" + dateTimeFormat(targetDateTime, "yyyy-MM-dd HH:mm:ss"));
		log.debug("between=" + between);
		
		boolean result = false;
		if (between < 300) {
			result = true;
		}
		
		log.debug("result=" + result);
		
		return result;
	}
	public static String dateTimeFormat(LocalDateTime datetime, String yyyyMMddHHmmss) throws Exception {
		return datetime.format(DateTimeFormatter.ofPattern(yyyyMMddHHmmss));
	}
	public static LocalDateTime localDateTimeByString(String str) throws Exception {
		int year = Integer.parseInt(str.substring(0, 4));
		int month = Integer.parseInt(str.substring(4, 6));
		int day = Integer.parseInt(str.substring(6, 8));
		int hour = Integer.parseInt(str.substring(8, 10));
		int minute = Integer.parseInt(str.substring(10, 12));
		int second = Integer.parseInt(str.substring(12, 14));
		
		LocalDateTime datetime = LocalDateTime.of(year, month, day, hour, minute, second);
		
		return datetime;
	}
}
