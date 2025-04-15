package com.ultari.additional.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.Socket;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class Api {
	private Socket sc;
	
	String ip = "127.0.0.1";
	int port = 1234;
	int timeout = 3 * 1000;
	
	public Api(String ip, int port, int timeout) {
		this.ip = ip;
		this.port = port;
		this.timeout = timeout * 1000;
	}
	
	public void send(String message) throws Exception {
		InputStreamReader ir = null;
		BufferedReader br = null;
		PrintWriter pw = null;
		if (connect()) {
			try {
				pw = new PrintWriter(sc.getOutputStream(), true);
				ir = new InputStreamReader(sc.getInputStream());
				br = new BufferedReader(ir);
				
				pw.println(message.toString());
				pw.flush();
				
				if ( !getMessage(br, "ok") ) throw new Exception("Cannot send message");
			} catch(Exception e) {
				log.error("", e);
				throw e;
			} finally {
				try { if (pw != null) {pw.close(); pw = null;}} catch(Exception ee) {}
				try { if (br != null) {br.close(); br = null;}} catch(Exception ee) {}
				try { if (ir != null) {ir.close(); ir = null;}} catch(Exception ee) {}
				try { if (sc != null) {sc.close(); sc = null;}} catch(Exception ee) {}
			}
		}
	}
	
	private boolean connect() {
		boolean result = true;
		
		try {
			sc = new Socket();
			sc.connect(new InetSocketAddress(ip, port), timeout);
			
			log.debug("Connection success (" + ip + ":" + port + ")");
		} catch(Exception e) {
			log.error("", e);
			result = false;
		}
		
		return result;
	}
	
	private boolean getMessage(BufferedReader br, String targetStr) throws Exception {
		char buf[] = new char[1024];
		int rcv = 0;
		
		StringBuffer str = new StringBuffer();
		
		while ( ( rcv = br.read(buf, 0, 1024) ) >= 0 ) {
			str.append(new String(buf, 0, rcv));

			System.out.println("str: [" + str.toString() + "]");
			
			if ( str.indexOf(targetStr) >= 0 )
				return true;
		}
		
		return false;
	}
}
