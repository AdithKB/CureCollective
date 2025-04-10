package com.mycare.qa.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.TestPropertySource;

@Configuration
@TestPropertySource(locations = "classpath:application-test.properties")
public class TestConfig {
    // Configuration beans can be added here if needed
} 