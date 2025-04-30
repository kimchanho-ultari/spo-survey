package com.ultari.additional.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class StringUtil {

	public static String uuid() {
		return UUID.randomUUID().toString().replaceAll("-", "");
	}
	public static String datetime(String yyyyMMddHHmmss) {
		return LocalDateTime.now().format(DateTimeFormatter.ofPattern(yyyyMMddHHmmss));
	}
	public static String lpad(String str, int len, String pad) {
		int pos = str.length();
		StringBuilder sb = new StringBuilder();
		for (int i = pos; i < len; i++) {
			sb.append(pad);
		}
		sb.append(str);
		return sb.toString();
	}
	public static String lpad(int str, int len, String pad) {
		String val = lpad(str + "", len, pad);
		return val;
	}

	public static String castNowDate(LocalDateTime dateTime) {
		DateTimeFormatter datePattern = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
		return dateTime.format(datePattern);
	}
}
