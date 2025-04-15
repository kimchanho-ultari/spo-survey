package com.ultari.additional.util;

import org.springframework.util.Base64Utils;

public class CryptorManager {

	public static String crypt(String str, String driver, String method, boolean isStatic, boolean useBase64) throws Exception {
		String val = str;
		
		if (useBase64 && method.equals("decrypt")) {
			val = new String(Base64Utils.decodeFromString(val), "UTF-8");
		}
		
		Object[] param = new Object[] {val};
		Reflection ref = new Reflection(driver, isStatic);
		val = (String) ref.invoke(method, param);
		
		if (useBase64 && method.equals("encrypt")) {
			val = new String(Base64Utils.encode(val.getBytes()), "UTF-8");
		}
		
		return val;
	}
	
	public static void main(String[] args) throws Exception {
		/*
		String s = "eE5mNGkweXZpVmk3VzFVaC94WHZNZz09";
		String enc = CryptorManager.crypt(s, "kr.co.ultari.cryptor.seed.Codec", "decrypt", false, true);
		System.out.println(enc);
		
		s = enc;
		enc = CryptorManager.crypt(s, "kr.co.ultari.cryptor.seed.Codec", "encrypt", false, true);
		System.out.println(enc);*/
		
		System.out.println("msgjeju=" + CryptorManager.crypt("msgjeju", "kr.co.ultari.cryptor.seed.Codec", "encrypt", false, true));
		System.out.println("msgseo=" + CryptorManager.crypt("msgseo", "kr.co.ultari.cryptor.seed.Codec", "encrypt", false, true));
		System.out.println("@jeju2394=" + CryptorManager.crypt("@jeju2394", "kr.co.ultari.cryptor.seed.Codec", "encrypt", false, true));
	}
}
