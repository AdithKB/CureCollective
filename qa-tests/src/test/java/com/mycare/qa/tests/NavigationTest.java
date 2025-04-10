package com.mycare.qa.tests;

import com.mycare.qa.config.TestBase;
import org.testng.annotations.Test;
import org.openqa.selenium.By;

public class NavigationTest extends TestBase {

    @Test
    public void testNavigationWhenLoggedOut() {
        // Verify home page title
        waitForElementVisible("[data-testid='page-title']");
        
        // Test Services link
        clickElement("[data-testid='services-link']");
        waitForElementVisible("[data-testid='page-title']");
        
        // Test About link
        clickElement("[data-testid='about-link']");
        waitForElementVisible("[data-testid='page-title']");
        
        // Test Contact link
        clickElement("[data-testid='contact-link']");
        waitForElementVisible("[data-testid='page-title']");
        
        // Test Home link
        clickElement("[data-testid='home-link']");
        waitForElementVisible("[data-testid='page-title']");
    }

    @Test
    public void testNavigationWhenLoggedIn() {
        // Login first
        clickElement("[data-testid='login-button']");
        waitForElementVisible("[data-testid='email-input']");
        driver.findElement(By.cssSelector("[data-testid='email-input']")).sendKeys("test@example.com");
        driver.findElement(By.cssSelector("[data-testid='password-input']")).sendKeys("Test123!@#");
        clickElement("[data-testid='submit-button']");
        waitForElementVisible("[data-testid='user-menu']");
        
        // Test navigation with user menu
        clickElement("[data-testid='user-menu']");
        waitForElementVisible("[data-testid='profile-link']");
        clickElement("[data-testid='profile-link']");
        waitForElementVisible("[data-testid='page-title']");
        
        // Test settings link
        clickElement("[data-testid='user-menu']");
        waitForElementVisible("[data-testid='settings-link']");
        clickElement("[data-testid='settings-link']");
        waitForElementVisible("[data-testid='page-title']");
        
        // Test logout
        clickElement("[data-testid='user-menu']");
        waitForElementVisible("[data-testid='logout-button']");
        clickElement("[data-testid='logout-button']");
        waitForElementToDisappear("[data-testid='user-menu']");
    }
} 