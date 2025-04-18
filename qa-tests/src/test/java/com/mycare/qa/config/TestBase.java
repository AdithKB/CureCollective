package com.mycare.qa.config;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.ElementClickInterceptedException;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Parameters;
import io.github.bonigarcia.wdm.WebDriverManager;

import java.time.Duration;

public class TestBase {
    protected WebDriver driver;
    protected WebDriverWait wait;
    protected String appUrl;

    @BeforeMethod
    @Parameters({"browser", "app.url"})
    public void setUp(String browser, String appUrl) {
        this.appUrl = appUrl;
        
        try {
            if (browser.equalsIgnoreCase("chrome") || browser.equalsIgnoreCase("brave")) {
                WebDriverManager.chromedriver().setup();
                ChromeOptions options = new ChromeOptions();
                if (browser.equalsIgnoreCase("brave")) {
                    options.setBinary("C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe");
                }
                options.addArguments("--start-maximized");
                options.addArguments("--disable-notifications");
                options.addArguments("--disable-popup-blocking");
                driver = new ChromeDriver(options);
            } else if (browser.equalsIgnoreCase("firefox")) {
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions options = new FirefoxOptions();
                options.addArguments("--start-maximized");
                driver = new FirefoxDriver(options);
            } else if (browser.equalsIgnoreCase("edge")) {
                WebDriverManager.edgedriver().setup();
                EdgeOptions options = new EdgeOptions();
                options.addArguments("--start-maximized");
                driver = new EdgeDriver(options);
            } else {
                throw new IllegalArgumentException("Unsupported browser: " + browser);
            }

            // Increase wait time to 20 seconds
            wait = new WebDriverWait(driver, Duration.ofSeconds(20));
            
            // Set implicit wait to 10 seconds
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
            
            // Maximize window
            driver.manage().window().maximize();
            
            // Navigate to the application
            driver.get(appUrl);
        } catch (Exception e) {
            System.err.println("Failed to initialize WebDriver: " + e.getMessage());
            throw e;
        }
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            try {
                driver.quit();
            } catch (Exception e) {
                System.err.println("Failed to quit WebDriver: " + e.getMessage());
            }
        }
    }

    protected void waitForElementVisible(String locator) {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(org.openqa.selenium.By.cssSelector(locator)));
        } catch (TimeoutException e) {
            System.err.println("Element not visible after timeout: " + locator);
            throw e;
        } catch (Exception e) {
            System.err.println("Error waiting for element visibility: " + locator);
            throw e;
        }
    }

    protected void waitForElementClickable(String locator) {
        try {
            wait.until(ExpectedConditions.elementToBeClickable(org.openqa.selenium.By.cssSelector(locator)));
        } catch (TimeoutException e) {
            System.err.println("Element not clickable after timeout: " + locator);
            throw e;
        } catch (Exception e) {
            System.err.println("Error waiting for element to be clickable: " + locator);
            throw e;
        }
    }

    protected void clickElement(String locator) {
        try {
            waitForElementClickable(locator);
            driver.findElement(org.openqa.selenium.By.cssSelector(locator)).click();
        } catch (ElementClickInterceptedException e) {
            System.err.println("Element click intercepted: " + locator);
            // Try JavaScript click as fallback
            try {
                org.openqa.selenium.JavascriptExecutor executor = (org.openqa.selenium.JavascriptExecutor) driver;
                executor.executeScript("arguments[0].click();", driver.findElement(org.openqa.selenium.By.cssSelector(locator)));
            } catch (Exception jsException) {
                System.err.println("JavaScript click also failed: " + jsException.getMessage());
                throw jsException;
            }
        } catch (Exception e) {
            System.err.println("Error clicking element: " + locator);
            throw e;
        }
    }

    protected void waitForElementToDisappear(String locator) {
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(org.openqa.selenium.By.cssSelector(locator)));
        } catch (TimeoutException e) {
            System.err.println("Element did not disappear after timeout: " + locator);
            throw e;
        } catch (Exception e) {
            System.err.println("Error waiting for element to disappear: " + locator);
            throw e;
        }
    }
} 