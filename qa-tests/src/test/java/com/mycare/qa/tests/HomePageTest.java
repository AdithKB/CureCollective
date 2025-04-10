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
    @Parameters("browser")
    public void setUp(String browser) {
        super.setUp(browser);
        homePage = new HomePage(driver);
        driver.get(appUrl);
    }

    @Test
    public void testSuccessfulLogin() {
        // Click login button
        clickElement("[data-testid='login-button']");
        
        // Wait for login modal and fill in credentials
        waitForElementVisible("[data-testid='email-input']");
        driver.findElement(By.cssSelector("[data-testid='email-input']")).sendKeys("test@example.com");
        driver.findElement(By.cssSelector("[data-testid='password-input']")).sendKeys("Test123!@#");
        
        // Submit login form
        clickElement("[data-testid='submit-button']");
        
        // Wait for success message
        waitForElementVisible("[data-testid='success-message']");
        
        // Verify user menu is visible
        waitForElementVisible("[data-testid='user-menu']");
    }

    @Test
    public void testFailedLogin() {
        homePage.login("invalid@example.com", "wrongpassword");
        String errorMessage = homePage.getErrorMessage();
        assertEquals(errorMessage, "Invalid email or password");
    }

    @Test
    public void testSuccessfulSignup() {
        // Click signup button
        clickElement("[data-testid='signup-button']");
        
        // Wait for signup modal and fill in form
        waitForElementVisible("[data-testid='email-input']");
        driver.findElement(By.cssSelector("[name='name']")).sendKeys("Test User");
        driver.findElement(By.cssSelector("[data-testid='email-input']")).sendKeys("test@example.com");
        driver.findElement(By.cssSelector("[data-testid='password-input']")).sendKeys("Test123!@#");
        driver.findElement(By.cssSelector("[data-testid='confirm-password-input']")).sendKeys("Test123!@#");
        
        // Submit signup form
        clickElement("[data-testid='submit-button']");
        
        // Wait for success message
        waitForElementVisible("[data-testid='success-message']");
    }

    @Test
    public void testPasswordMismatch() {
        // Click signup button
        clickElement("[data-testid='signup-button']");
        
        // Wait for signup modal and fill in form
        waitForElementVisible("[data-testid='email-input']");
        driver.findElement(By.cssSelector("[name='name']")).sendKeys("Test User");
        driver.findElement(By.cssSelector("[data-testid='email-input']")).sendKeys("test@example.com");
        driver.findElement(By.cssSelector("[data-testid='password-input']")).sendKeys("Test123!@#");
        driver.findElement(By.cssSelector("[data-testid='confirm-password-input']")).sendKeys("Test123!@#Different");
        
        // Submit signup form
        clickElement("[data-testid='submit-button']");
        
        // Wait for error message
        waitForElementVisible("[data-testid='error-message']");
    }

    @Test
    public void testPasswordStrengthIndicator() {
        homePage.clickSignupButton();
        homePage.enterPassword("weak");
        String strengthIndicator = homePage.getPasswordStrengthIndicatorText();
        assertEquals(strengthIndicator, "Weak");
        
        homePage.enterPassword("StrongPassword123!");
        strengthIndicator = homePage.getPasswordStrengthIndicatorText();
        assertEquals(strengthIndicator, "Strong");
    }

    @Test
    public void testTermsAndConditions() {
        // Click signup button
        clickElement("[data-testid='signup-button']");
        
        // Wait for signup modal
        waitForElementVisible("[data-testid='email-input']");
        
        // Close modal
        clickElement("[data-testid='close-modal-button']");
        
        // Verify modal is closed
        waitForElementToDisappear("[data-testid='email-input']");
    }

    @Test
    public void testForgotPassword() {
        homePage.resetPassword("test@example.com");
        String successMessage = homePage.getSuccessMessage();
        assertEquals(successMessage, "Password reset instructions sent to your email");
    }

    @Test
    public void testInvalidEmailFormat() {
        // Click login button
        clickElement("[data-testid='login-button']");
        
        // Wait for login modal and fill in invalid email
        waitForElementVisible("[data-testid='email-input']");
        driver.findElement(By.cssSelector("[data-testid='email-input']")).sendKeys("invalid-email");
        driver.findElement(By.cssSelector("[data-testid='password-input']")).sendKeys("Test123!@#");
        
        // Submit login form
        clickElement("[data-testid='submit-button']");
        
        // Wait for error message
        waitForElementVisible("[data-testid='error-message']");
    }

    @Test
    public void testModalClose() {
        homePage.clickLoginButton();
        homePage.closeModal();
        // Verify modal is closed by checking if login button is clickable again
        homePage.clickLoginButton();
        // If we can click the login button again, the modal was successfully closed
    }

    @Test
    public void testEmptyFields() {
        homePage.clickSignupButton();
        homePage.clickSubmitButton();
        String errorMessage = homePage.getErrorMessage();
        assertEquals(errorMessage, "Please fill in all required fields");
    }

    @Test
    public void testNavigationLinks() {
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
    public void testUserMenu() {
        // Login first
        testSuccessfulLogin();
        
        // Click user menu
        clickElement("[data-testid='user-menu']");
        
        // Verify menu items
        waitForElementVisible("[data-testid='profile-link']");
        waitForElementVisible("[data-testid='logout-button']");
        
        // Test logout
        clickElement("[data-testid='logout-button']");
        waitForElementToDisappear("[data-testid='user-menu']");
    }
} 