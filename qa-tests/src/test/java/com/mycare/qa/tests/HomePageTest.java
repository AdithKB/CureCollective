package com.mycare.qa.tests;

import com.mycare.qa.config.TestBase;
import com.mycare.qa.pages.HomePage;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Parameters;
import org.testng.annotations.Test;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.assertFalse;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.TimeoutException;

@SpringBootTest
@ContextConfiguration(classes = com.mycare.qa.config.TestConfig.class)
public class HomePageTest extends TestBase {
    private HomePage homePage;

    @BeforeMethod
    @Parameters({"browser", "app.url"})
    public void setUp(String browser, String appUrl) {
        super.setUp(browser, appUrl);
        homePage = new HomePage(driver);
    }

    @Test
    public void testInitialPageLoad() {
        // Verify page title is present
        assertTrue(isElementPresent("[data-testid='page-title']"), "Page title should be present");
        
        // Verify login and signup buttons are present
        assertTrue(isElementPresent("[data-testid='login-button']"), "Login button should be present");
        assertTrue(isElementPresent("[data-testid='signup-button']"), "Signup button should be present");
    }

    @Test
    public void testLoginModalElements() {
        // Click login button to open modal
        clickElement("[data-testid='login-button']");
        
        // Verify all login form elements are present
        assertTrue(isElementPresent("[data-testid='email-input']"), "Email input should be present");
        assertTrue(isElementPresent("[data-testid='password-input']"), "Password input should be present");
        assertTrue(isElementPresent("[data-testid='submit-button']"), "Submit button should be present");
        assertTrue(isElementPresent("[data-testid='close-modal-button']"), "Close modal button should be present");
        
        // Close the modal
        clickElement("[data-testid='close-modal-button']");
        
        // Verify modal is closed
        assertFalse(isElementPresent("[data-testid='email-input']"), "Login modal should be closed");
    }

    @Test
    public void testSignupModalElements() {
        // Click signup button to open modal
        clickElement("[data-testid='signup-button']");
        
        // Verify all signup form elements are present
        assertTrue(isElementPresent("[data-testid='email-input']"), "Email input should be present");
        assertTrue(isElementPresent("[data-testid='password-input']"), "Password input should be present");
        assertTrue(isElementPresent("[data-testid='confirm-password-input']"), "Confirm password input should be present");
        assertTrue(isElementPresent("[data-testid='submit-button']"), "Submit button should be present");
        assertTrue(isElementPresent("[data-testid='close-modal-button']"), "Close modal button should be present");
        
        // Close the modal
        clickElement("[data-testid='close-modal-button']");
        
        // Verify modal is closed
        assertFalse(isElementPresent("[data-testid='email-input']"), "Signup modal should be closed");
    }

    @Test
    public void testNavigationLinks() {
        // Verify all navigation links are present
        assertTrue(isElementPresent("[data-testid='services-link']"), "Services link should be present");
        assertTrue(isElementPresent("[data-testid='about-link']"), "About link should be present");
        assertTrue(isElementPresent("[data-testid='contact-link']"), "Contact link should be present");
        assertTrue(isElementPresent("[data-testid='home-link']"), "Home link should be present");
    }

    @Test
    public void testLoginFormValidation() {
        // Click login button
        clickElement("[data-testid='login-button']");
        
        // Try to submit empty form
        clickElement("[data-testid='submit-button']");
        
        // Verify error message appears
        assertTrue(isElementPresent("[data-testid='error-message']"), "Error message should appear for empty form");
        
        // Close modal
        clickElement("[data-testid='close-modal-button']");
    }

    @Test
    public void testSignupFormValidation() {
        // Click signup button
        clickElement("[data-testid='signup-button']");
        
        // Try to submit empty form
        clickElement("[data-testid='submit-button']");
        
        // Verify error message appears
        assertTrue(isElementPresent("[data-testid='error-message']"), "Error message should appear for empty form");
        
        // Close modal
        clickElement("[data-testid='close-modal-button']");
    }

    @Test
    public void testSuccessfulLogin() {
        // Click login button
        clickElement("[data-testid='login-button']");
        
        // Fill in valid credentials
        driver.findElement(By.cssSelector("[data-testid='email-input']")).sendKeys("test@example.com");
        driver.findElement(By.cssSelector("[data-testid='password-input']")).sendKeys("Test123!@#");
        
        // Submit form
        clickElement("[data-testid='submit-button']");
        
        // Verify success message
        assertTrue(isElementPresent("[data-testid='success-message']"), "Success message should appear after login");
        
        // Verify user menu is visible
        assertTrue(isElementPresent("[data-testid='user-menu']"), "User menu should be visible after login");
    }

    @Test
    public void testUserMenuElements() {
        // First login
        testSuccessfulLogin();
        
        // Click user menu
        clickElement("[data-testid='user-menu']");
        
        // Verify menu items
        assertTrue(isElementPresent("[data-testid='profile-link']"), "Profile link should be present");
        assertTrue(isElementPresent("[data-testid='logout-button']"), "Logout button should be present");
        
        // Test logout
        clickElement("[data-testid='logout-button']");
        
        // Verify user menu is no longer visible
        assertFalse(isElementPresent("[data-testid='user-menu']"), "User menu should not be visible after logout");
    }

    private boolean isElementPresent(String selector) {
        try {
            driver.findElement(By.cssSelector(selector));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    protected void clickElement(String selector) {
        try {
            driver.findElement(By.cssSelector(selector)).click();
        } catch (Exception e) {
            throw new RuntimeException("Failed to click element: " + selector, e);
        }
    }
} 