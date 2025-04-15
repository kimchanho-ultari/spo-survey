package com.ultari.additional.util;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import kr.co.ultari.noti.api2.manager.NotiManager;
import kr.co.ultari.noti.api2.manager.data.NotiData;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class ApiManager {
	@Value("${common.api.ip}")
	private String IP;
	@Value("${common.api.port}")
	private int PORT;
	@Value("${common.api.timeout}")
	private int timeout;
	
	public void send(String message) throws Exception {
		log.info("Send a message to the messenger server: " + message);
		Api api = new Api(IP, PORT, timeout);
		api.send(message);
	}
	
	
	
	public String noti(List<NotiData> list) throws Exception {
		log.info("Send a message to the messenger server: survey noti");
		NotiManager manager = new NotiManager(IP, PORT);
		for (NotiData data : list) {
			manager.addData(data);
		}
		
		String result = manager.send();
		return result;
	}
}
