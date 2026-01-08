package com.bartr.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(scanBasePackages = {"com.bartr.notification", "com.bartr.common.security"})
@EnableFeignClients(basePackages = "com.bartr.notification")
public class NotificationAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(NotificationAppApplication.class, args);
	}

}
