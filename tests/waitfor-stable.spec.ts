import { test, expect } from '@playwright/test';
import { setupStableLocatorSupport, enhanceLocator, EnhancedLocator } from '../index';

// Extend the Playwright Page interface for TypeScript
declare module '@playwright/test' {
  interface Page {
    stableLocator(selector: string): EnhancedLocator;
  }
}

// This is for notification only, the real enhancement happens on each locator
setupStableLocatorSupport();

test.describe('waitFor with state: stable Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a helper function to get enhanced locators
    page.stableLocator = (selector: string) => {
      return enhanceLocator(page.locator(selector));
    };

    // Navigate to our test page with animations
    await page.goto('http://localhost:8080/tests/animated-page.html');
  });

  test('waitFor with state: stable works correctly', async ({ page }) => {
    // First, make sure animations are running
    if (await page.locator('#toggle-animations').textContent() === 'Start All Animations') {
      await page.locator('#toggle-animations').click();
    }

    // Get a regular locator and enhance it
    const locator = enhanceLocator(page.locator('#moving-btn'));

    // Try with animation running - should fail with timeout
    const unstablePromise = locator.waitFor({ state: 'stable', timeout: 500 });
    await expect(unstablePromise).rejects.toThrow(/not stable/);

    // Now stop the animation
    await page.locator('#toggle-animations').click();
    await page.waitForTimeout(500); // Short wait for animation to stop

    // Now it should succeed with waitFor state: stable
    await locator.waitFor({ state: 'stable', timeout: 2000 });

    // Click the now-stable button
    await locator.click();

    // Check if the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Moving Button" was clicked');
  });

  test('waitFor with state: stable works with other states too', async ({ page }) => {
    // First, make sure animations are stopped
    if (await page.locator('#toggle-animations').textContent() !== 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }

    // Hide a button with JS
    await page.evaluate(() => {
      const button = document.getElementById('normal-btn');
      if (button) button.style.visibility = 'hidden';
    });

    // Get a regular locator and enhance it
    const locator = enhanceLocator(page.locator('#normal-btn'));

    // waitFor with state: visible should work normally
    const visiblePromise = locator.waitFor({ state: 'visible', timeout: 500 });
    await expect(visiblePromise).rejects.toThrow();

    // Make the button visible again
    await page.evaluate(() => {
      const button = document.getElementById('normal-btn');
      if (button) button.style.visibility = 'visible';
    });

    // Now waitFor with state: visible should succeed
    await locator.waitFor({ state: 'visible', timeout: 2000 });

    // And waitFor with state: stable should also succeed
    await locator.waitFor({ state: 'stable', timeout: 2000 });

    // Click the now-visible and stable button
    await locator.click();

    // Check if the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Static Button" was clicked');
  });
});
