package com.mycare.qa.pages;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class NavigationPage {
    private final WebDriver driver;
    private final WebDriverWait wait;

    @FindBy(css = "a[data-testid='home-link']")
    private WebElement homeLink;

    @FindBy(css = "a[data-testid='services-link']")
    private WebElement servicesLink;

    @FindBy(css = "a[data-testid='about-link']")
    private WebElement aboutLink;

    @FindBy(css = "a[data-testid='contact-link']")
    private WebElement contactLink;

    @FindBy(css = "a[data-testid='profile-link']")
    private WebElement profileLink;

    @FindBy(css = "button[data-testid='logout-button']")
    private WebElement logoutButton;

    @FindBy(css = "div[data-testid='user-menu']")
    private WebElement userMenu;

    @FindBy(css = "h1[data-testid='page-title']")
    private WebElement pageTitle;

    public NavigationPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    public void clickHomeLink() {
        wait.until(ExpectedConditions.elementToBeClickable(homeLink)).click();
    }

    public void clickServicesLink() {
        wait.until(ExpectedConditions.elementToBeClickable(servicesLink)).click();
    }

    public void clickAboutLink() {
        wait.until(ExpectedConditions.elementToBeClickable(aboutLink)).click();
    }

    public void clickContactLink() {
        wait.until(ExpectedConditions.elementToBeClickable(contactLink)).click();
    }

    public void clickProfileLink() {
        wait.until(ExpectedConditions.elementToBeClickable(profileLink)).click();
    }

    public void clickLogoutButton() {
        wait.until(ExpectedConditions.elementToBeClickable(logoutButton)).click();
    }

    public void openUserMenu() {
        wait.until(ExpectedConditions.elementToBeClickable(userMenu)).click();
    }

    public String getPageTitle() {
        return wait.until(ExpectedConditions.visibilityOf(pageTitle)).getText();
    }

    public boolean isUserMenuVisible() {
        try {
            return userMenu.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void navigateToHome() {
        clickHomeLink();
    }

    public void navigateToServices() {
        clickServicesLink();
    }

    public void navigateToAbout() {
        clickAboutLink();
    }

    public void navigateToContact() {
        clickContactLink();
    }

    public void navigateToProfile() {
        openUserMenu();
        clickProfileLink();
    }

    public void logout() {
        openUserMenu();
        clickLogoutButton();
    }
} 