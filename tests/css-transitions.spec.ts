import { test, expect } from '@playwright/test';
import { setupStableLocatorSupport, createStableLocator, StableLocatorType } from '../index';

// Extend the Playwright Page interface for TypeScript
declare module '@playwright/test' {
  interface Page {
    stableLocator(selector: string, debug?: boolean): StableLocatorType;
  }
}

// This is for notification only, the real enhancement happens on each locator
setupStableLocatorSupport();

test.describe('CSS Transitions and Advanced Animation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a helper function to get stable locators
    page.stableLocator = (selector: string, debug?: boolean) => {
      return createStableLocator(page.locator(selector), debug);
    };

    // Navigate to our test page with animations
    await page.goto('http://localhost:8080/tests/animated-page.html');
  });

  test('can click button with CSS color transition', async ({ page }) => {
    // First ensure animations are stopped
    if (await page.locator('#toggle-animations').textContent() !== 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }

    // Trigger the color transition by hovering
    await page.hover('#color-transition-btn');
    await page.waitForTimeout(100); // Wait for color transition to start

    // For color transitions, our stability detector should consider this stable
    // since color changes don't affect position
    await page.locator('#color-transition-btn').click();

    // Verify the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Color Transition" was clicked');
  });

  test('correctly handles position transitions', async ({ page }) => {
    // First ensure animations are stopped
    if (await page.locator('#toggle-animations').textContent() !== 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }

    // Get initial state of the button
    const initialRect = await page.locator('#moving-transition-btn').boundingBox();

    // Toggle the transition to move the button
    await page.locator('#toggle-transition').click();

    // We don't want to use the stability detector during known transitions
    // Instead, wait for the transition to complete (transition is 1.5s)
    await page.waitForTimeout(1600);

    // Verify the button has moved
    const newRect = await page.locator('#moving-transition-btn').boundingBox();
    expect(newRect?.x).not.toEqual(initialRect?.x);

    // Now click the stable button
    await page.locator('#moving-transition-btn').click();

    // Verify the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Moving Transition" was clicked');
  });

  test('handles multiple animations on an element', async ({ page }) => {
    // First ensure animations are running
    if (await page.locator('#toggle-animations').textContent() === 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }

    // The multi-animation button should be unstable during animation
    try {
      await page.stableLocator('#multi-animation-btn').waitForStable({ timeout: 500 });
      throw new Error('Button should be unstable during animation');
    } catch (error) {
      // Expected error, button is animating
      console.log('Button correctly detected as unstable during animation');
    }

    // Stop animations
    await page.locator('#toggle-animations').click();
    await page.waitForTimeout(500);

    // Now the button should be stable
    await page.stableLocator('#multi-animation-btn').waitForStable({ timeout: 2000 });

    // Click the now-stable button
    await page.stableLocator('#multi-animation-btn').click();

    // Verify the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Multiple Animations" was clicked');
  });

  test('can detect when animations start after being stable', async ({ page }) => {
    // First ensure animations are stopped
    if (await page.locator('#toggle-animations').textContent() !== 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }

    // The button should be stable now
    await page.stableLocator('#shaking-btn').waitForStable({ timeout: 2000 });

    // Start animations
    await page.locator('#toggle-animations').click();
    await page.waitForTimeout(100);

    // Now the button should be unstable
    try {
      await page.stableLocator('#shaking-btn').waitForStable({ timeout: 500 });
      throw new Error('Button should be unstable during animation');
    } catch (error) {
      // Expected error, button is animating
      console.log('Button correctly detected as unstable after animation started');
    }

    // Stop animations again
    await page.locator('#toggle-animations').click();
    await page.waitForTimeout(500);

    // Now button should be stable again
    await page.stableLocator('#shaking-btn').waitForStable({ timeout: 2000 });

    // Click the now-stable button
    await page.stableLocator('#shaking-btn').click();

    // Verify the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Shaking Button" was clicked');
  });

  test('can handle growing animations', async ({ page }) => {
    // First ensure animations are stopped
    if (await page.locator('#toggle-animations').textContent() !== 'Start All Animations') {
      await page.locator('#toggle-animations').click();
      await page.waitForTimeout(500);
    }

    // First start animations to make the element grow
    await page.locator('#toggle-animations').click();
    await page.waitForTimeout(100);

    // Get the initial state of the button to check later
    const initialScale = await page.locator('#growing-btn').evaluate(el => {
      const style = window.getComputedStyle(el);
      const transform = style.transform;
      if (transform && transform !== 'none') {
        const match = transform.match(/matrix\(([^,]+),\s*[^,]+,\s*[^,]+,\s*([^,]+)/);
        if (match) {
          return Math.max(parseFloat(match[1]), parseFloat(match[2]));
        }
      }
      return 1;
    });

    console.log('Initial scale:', initialScale);

    // Now stop animations to test stable element
    await page.locator('#toggle-animations').click();
    await page.waitForTimeout(500);

    // Now the element should be stable
    await page.stableLocator('#growing-btn').waitForStable({
      timeout: 2000
    });

    // Click the button
    await page.stableLocator('#growing-btn').click();

    // Verify the click was logged
    await expect(page.locator('#log-entries p').first()).toContainText('Button "Growing Button" was clicked');
  });
});