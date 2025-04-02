import { test, expect } from '@playwright/test';
import { setupStableLocatorSupport, createStableLocator, setDefaultDebugMode, getDefaultDebugMode, StableLocator, StableLocatorType } from '../index';

// Extend the Playwright Page interface for TypeScript
declare module '@playwright/test' {
  interface Page {
    stableLocator(selector: string, debug?: boolean): StableLocatorType;
  }
}

// This is for notification only, the real enhancement happens on each locator
// Let's keep debug mode OFF by default for this test file
setupStableLocatorSupport({ debug: false });

test.describe('Debug Stable Locator', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a helper function to get stable locators
    page.stableLocator = (selector: string, debug?: boolean) => {
      return createStableLocator(page.locator(selector), debug);
    };

    // Navigate to our test page with animations
    await page.goto('http://localhost:8080/tests/animated-page.html');
  });

  test('basic static button test', async ({ page }) => {
    // First ensure animations are stopped
    if (await page.locator('#toggle-animations').textContent() !== 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }

    // Test with a static button (no animations)
    await page.stableLocator('#normal-btn').waitForStable({ timeout: 2000 });
    await page.stableLocator('#normal-btn').click();

    // Verify the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Static Button" was clicked');
  });

  test('debugging stability detection', async ({ page }) => {
    // First ensure animations are running
    if (await page.locator('#toggle-animations').textContent() === 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }

    // Test with a moving button
    const buttonInfo = await page.evaluate(() => {
      const movingBtn = document.querySelector('#moving-btn');
      if (!movingBtn) return null;

      const style = window.getComputedStyle(movingBtn);
      return {
        animationName: style.animationName,
        animationPlayState: style.animationPlayState,
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
        rect: movingBtn.getBoundingClientRect()
      };
    });

    console.log('Moving button info:', buttonInfo);

    // First try with animation running and debug mode ON
    // This will output detailed logs to help diagnose stability issues
    const unstablePromise = page.stableLocator('#moving-btn', true).waitForStable({ timeout: 500 });
    await expect(unstablePromise).rejects.toThrow(/not stable/);

    // Now stop the animation
    await page.locator('#toggle-animations').click();
    await page.waitForTimeout(500);

    // Now should be stable - set debug mode ON to see detailed stability information
    await page.stableLocator('#moving-btn', true).waitForStable({ timeout: 2000 });

    // Click the now-stable button
    await page.stableLocator('#moving-btn').click();

    // Verify the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Moving Button" was clicked');
  });

  test('using debug mode options', async ({ page }) => {
    console.log('This test demonstrates different ways to enable debug mode');

    // Option 1: Turn debug mode on globally for all tests
    // Note: This will affect all tests that run after this point
    // We're temporarily enabling it, and will reset it at the end of the test
    const originalDebugMode = getDefaultDebugMode();
    setDefaultDebugMode(true);

    // Option 2: Enable debug mode when creating the locator
    const locator1 = page.stableLocator('#normal-btn', true);

    // Option 3: Enable debug mode for a specific waitForStable call
    await page.stableLocator('#normal-btn').waitForStable({ debug: true });

    // Option 4: Using direct StableLocator creation (not available via the page helper)
    // This allows access to the setDebugMode method
    const stableLocator = new StableLocator(page.locator('#normal-btn'));
    stableLocator.setDebugMode(true);
    await stableLocator.waitForStable();

    // Reset global debug mode to its original value
    setDefaultDebugMode(originalDebugMode);
  });
});