package com.ultari.additional;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AtAdditionalServiceJejuApplication {

	public static void main(String[] args) {
		SpringApplication.run(AtAdditionalServiceJejuApplication.class, args);
	}

}
