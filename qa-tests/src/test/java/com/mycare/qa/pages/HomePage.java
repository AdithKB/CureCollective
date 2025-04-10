package com.mycare.qa.pages;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class HomePage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    @FindBy(css = "button[data-testid='login-button']")
    private WebElement loginButton;

    @FindBy(css = "button[data-testid='signup-button']")
    private WebElement signupButton;

    @FindBy(css = "input[data-testid='email-input']")
    private WebElement emailInput;

    @FindBy(css = "input[data-testid='password-input']")
    private WebElement passwordInput;

    @FindBy(css = "input[data-testid='confirm-password-input']")
    private WebElement confirmPasswordInput;

    @FindBy(css = "button[data-testid='submit-button']")
    private WebElement submitButton;

    @FindBy(css = "div[data-testid='error-message']")
    private WebElement errorMessage;

    @FindBy(css = "div[data-testid='success-message']")
    private WebElement successMessage;

    @FindBy(css = "a[data-testid='forgot-password-link']")
    private WebElement forgotPasswordLink;

    @FindBy(css = "button[data-testid='close-modal-button']")
    private WebElement closeModalButton;

    @FindBy(css = "div[data-testid='password-strength-indicator']")
    private WebElement passwordStrengthIndicator;

    @FindBy(css = "div[data-testid='terms-checkbox']")
    private WebElement termsCheckbox;

    public HomePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public void clickLoginButton() {
        wait.until(ExpectedConditions.elementToBeClickable(loginButton)).click();
    }

    public void clickSignupButton() {
        wait.until(ExpectedConditions.elementToBeClickable(signupButton)).click();
    }

    public void enterEmail(String email) {
        wait.until(ExpectedConditions.visibilityOf(emailInput)).sendKeys(email);
    }

    public void enterPassword(String password) {
        wait.until(ExpectedConditions.visibilityOf(passwordInput)).sendKeys(password);
    }

    public void enterConfirmPassword(String password) {
        wait.until(ExpectedConditions.visibilityOf(confirmPasswordInput)).sendKeys(password);
    }

    public void clickSubmitButton() {
        wait.until(ExpectedConditions.elementToBeClickable(submitButton)).click();
    }

    public String getErrorMessage() {
        return wait.until(ExpectedConditions.visibilityOf(errorMessage)).getText();
    }

    public String getSuccessMessage() {
        return wait.until(ExpectedConditions.visibilityOf(successMessage)).getText();
    }

    public void clickForgotPasswordLink() {
        wait.until(ExpectedConditions.elementToBeClickable(forgotPasswordLink)).click();
    }

    public void closeModal() {
        wait.until(ExpectedConditions.elementToBeClickable(closeModalButton)).click();
    }

    public String getPasswordStrengthIndicatorText() {
        return wait.until(ExpectedConditions.visibilityOf(passwordStrengthIndicator)).getText();
    }

    public void checkTermsCheckbox() {
        wait.until(ExpectedConditions.elementToBeClickable(termsCheckbox)).click();
    }

    public boolean isTermsCheckboxChecked() {
        return termsCheckbox.isSelected();
    }

    public void login(String email, String password) {
        clickLoginButton();
        enterEmail(email);
        enterPassword(password);
        clickSubmitButton();
    }

    public void signup(String email, String password) {
        clickSignupButton();
        enterEmail(email);
        enterPassword(password);
        clickSubmitButton();
    }

    public void signupWithConfirmPassword(String email, String password, String confirmPassword) {
        clickSignupButton();
        enterEmail(email);
        enterPassword(password);
        enterConfirmPassword(confirmPassword);
        clickSubmitButton();
    }

    public void signupWithTerms(String email, String password, String confirmPassword) {
        clickSignupButton();
        enterEmail(email);
        enterPassword(password);
        enterConfirmPassword(confirmPassword);
        checkTermsCheckbox();
        clickSubmitButton();
    }

    public void resetPassword(String email) {
        clickForgotPasswordLink();
        enterEmail(email);
        clickSubmitButton();
    }
} 