package com.smartfarm360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SmartfarmBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartfarmBackendApplication.class, args);
    }

}