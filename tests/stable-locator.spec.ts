import { test, expect } from '@playwright/test';
import { setupStableLocatorSupport, enhanceLocator } from '../index';

// Extend the Playwright Page interface for TypeScript
declare module '@playwright/test' {
  interface Page {
    stableLocator(selector: string): ReturnType<typeof enhanceLocator>;
  }
}

// This is for notification only, the real enhancement happens on each locator
setupStableLocatorSupport();

test.describe('Stable Locator Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a helper function to get enhanced locators
    page.stableLocator = (selector: string) => {
      return enhanceLocator(page.locator(selector));
    };
    
    // Navigate to our test page with animations
    await page.goto('http://localhost:8080/tests/animated-page.html');
  });

  test('can click a static button immediately', async ({ page }) => {
    // Static buttons should be clickable immediately
    await page.stableLocator('#normal-btn').click();
    
    // Check if the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Static Button" was clicked');
  });
  
  test('can wait for button to be stable after animation stops', async ({ page }) => {
    // First, make sure animations are running
    if (await page.locator('#toggle-animations').textContent() === 'Start All Animations') {
      await page.locator('#toggle-animations').click();
    }
    
    // Then stop all animations
    await page.locator('#toggle-animations').click();
    
    // Check if the animations were stopped (button text changes)
    await expect(page.locator('#toggle-animations')).toHaveText('Start All Animations');
    
    // Wait for a short time to make sure animations have fully stopped
    await page.waitForTimeout(500);
    
    // Now the button should be stable
    await page.stableLocator('#moving-btn').waitForStable({ timeout: 2000 });
    
    // Click the now-stable button
    await page.stableLocator('#moving-btn').click();
    
    // Check if the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Moving Button" was clicked');
  });
  
  test('detects different animation types correctly', async ({ page }) => {
    // Test with growing button
    // First stop animations if they're running
    if (await page.locator('#toggle-animations').textContent() !== 'Start All Animations') {
      await page.locator('#toggle-animations').click();
    }
    
    // Wait to ensure animations are stopped
    await page.waitForTimeout(500);
    
    // Now the growing button should be stable
    await page.stableLocator('#growing-btn').waitForStable({ timeout: 2000 });
    
    // Click the now-stable button
    await page.stableLocator('#growing-btn').click();
    
    // Check if the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Growing Button" was clicked');
    
    // Now test with starting animation
    await page.locator('#toggle-animations').click();
    
    // Try to click without waiting - should throw error or fail
    const stablePromise = page.stableLocator('#growing-btn').waitForStable({ timeout: 500 });
    
    // This should throw an error because the element is not stable
    await expect(stablePromise).rejects.toThrow(/not stable/);
  });
  
  test('waits for delayed appearance animation to finish', async ({ page }) => {
    // Make sure animations are running
    if (await page.locator('#toggle-animations').textContent() === 'Start All Animations') {
      await page.locator('#toggle-animations').click();
    }
    
    // The delayed button starts hidden and becomes visible after a few seconds
    // It should not be immediately clickable
    
    // Wait for button to be visible first (our test page has 2s delay)
    await page.locator('#delayed-btn').waitFor({ state: 'visible', timeout: 3000 });
    
    // Stop animations so we can test stability
    await page.locator('#toggle-animations').click();
    await page.waitForTimeout(500); // Short wait for animation to stop
    
    // Now button should be stable
    await page.stableLocator('#delayed-btn').waitForStable({ timeout: 2000 });
    
    // Click the now-stable and visible button
    await page.stableLocator('#delayed-btn').click();
    
    // Check if the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Delayed Button" was clicked');
  });

  test('handles visibility changes properly', async ({ page }) => {
    // First, stop any running animations
    if (await page.locator('#toggle-animations').textContent() !== 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }
    
    // Make a button invisible with JS
    await page.evaluate(() => {
      const button = document.getElementById('normal-btn');
      if (button) button.style.visibility = 'hidden';
    });
    
    // Verify the button is not visible
    await expect(page.locator('#normal-btn')).not.toBeVisible();
    
    // waitForStable should not complete on invisible elements
    const stablePromiseInvisible = page.stableLocator('#normal-btn').waitForStable({ timeout: 500 });
    await expect(stablePromiseInvisible).rejects.toThrow();
    
    // Make the button visible again
    await page.evaluate(() => {
      const button = document.getElementById('normal-btn');
      if (button) button.style.visibility = 'visible';
    });
    
    // Now button should be visible and stable
    await page.stableLocator('#normal-btn').waitForStable({ timeout: 2000 });
    
    // Click the now-visible button
    await page.stableLocator('#normal-btn').click();
    
    // Check if the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Static Button" was clicked');
  });
  
  test('successfully handles animation race conditions', async ({ page }) => {
    // This test starts and stops animations in quick succession to test race conditions
    
    // Function to toggle animations rapidly
    await page.evaluate(() => {
      const toggleBtn = document.getElementById('toggle-animations');
      if (!toggleBtn) return;
      
      // Toggle 3 times rapidly
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          toggleBtn.click();
        }, i * 100);
      }
    });
    
    // Wait a moment for all toggles to complete
    await page.waitForTimeout(500);
    
    // Check current state of toggle button to determine if animations are on/off
    const buttonText = await page.locator('#toggle-animations').textContent();
    
    if (buttonText === 'Start All Animations') {
      // Animations are off, button should be stable
      await page.stableLocator('#shaking-btn').waitForStable({ timeout: 2000 });
    } else {
      // Animations are on, stop them first
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
      await page.stableLocator('#shaking-btn').waitForStable({ timeout: 2000 });
    }
    
    // Now click should succeed
    await page.stableLocator('#shaking-btn').click();
    
    // Verify the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Shaking Button" was clicked');
  });
}); 