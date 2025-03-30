# Playwright Stable Locator

This library extends Playwright with the ability to wait for elements to be stable (not animating) before interacting with them.

## Features

- Adds `waitForStable()` method to Playwright's Locator
- Extends the standard `waitFor()` method with a new 'stable' state
- Detects CSS animations, transitions, and positional/size changes
- Makes your tests more reliable when dealing with animated elements

## Installation

```bash
npm install playwright-stable-locator --save-dev
```

## Usage

```typescript
import { test, expect } from '@playwright/test';
import { setupStableLocatorSupport } from 'playwright-stable-locator';

// Set up Playwright with stable locator functionality
setupStableLocatorSupport();

test('waits for button to be stable before clicking', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Use the new stable state
  await page.locator('button.animated').waitFor({ state: 'stable' });
  
  // Or use the dedicated method
  await page.locator('button.animated').waitForStable();
  
  // Now safe to click
  await page.locator('button.animated').click();
});
```

## Running the tests

This repository includes comprehensive tests that demonstrate how to use the stable locator.

### Setup

```bash
# Install dependencies
npm install

# Build the library
npm run build
```

### Run tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/stable-locator.spec.ts
```

## Test examples

The test suite includes:

1. Basic tests with various animation styles
2. Dynamic animation tests that start/stop animations during test execution
3. Tests for timeout handling and error cases
4. Real-world animation scenarios

## How it works

The library enhances Playwright's Locator API by adding stability detection using the following techniques:

1. Checking if CSS animations or transitions are active using `getComputedStyle`
2. Properly handling paused animations by checking `animationPlayState`
3. Detecting position and size changes by comparing `getBoundingClientRect()` results over time
4. Adding a small wait and verification cycle to ensure the element has truly stopped moving

## Implementation Details

The key components of this library are:

1. **StableLocator** - The core class that implements the stability detection logic
2. **enhanceLocator** - A function that enhances Playwright's Locator with stability methods
3. **setupStableLocatorSupport** - A helper function to initialize the stability detection functionality

### Understanding Animation Detection

The library determines if an element is stable by:
- Checking if CSS animations are running (not just present)
- Verifying that element position and size remain consistent over time
- Handling edge cases like transitions and transform changes

## Usage Examples

```typescript
// Basic usage
await page.stableLocator('button.animated').waitForStable();

// With timeout option
await page.stableLocator('#moving-element').waitForStable({ timeout: 5000 });

// Using with waitFor state
await page.stableLocator('.growing-button').waitFor({ state: 'stable' });

// Combining with other Playwright actions
const button = page.stableLocator('.shaking-button');
await button.waitForStable();
await button.click();
```

## Test Coverage

The test suite provides comprehensive coverage of the Stable Locator functionality:

### Animation Types Tested
- Position animations (horizontal movement)
- Size animations (growing/shrinking elements)
- Shaking animations (rapid position changes)
- Delayed appearance animations (opacity transitions)
- CSS transitions for position changes
- CSS transitions for color changes
- Multiple simultaneous animations on a single element

### Test Scenarios
1. **Static elements** - Verifying that non-animated elements are immediately stable
2. **Animation lifecycle** - Testing elements through start-animation → stop-animation cycles
3. **Dynamic animations** - Adding/removing animations during test execution
4. **Stability detection** - Ensuring the stability algorithm properly detects different animation types
5. **Transition handling** - Testing CSS transitions with various properties
6. **Edge cases** - Testing invisible elements, multiple animations, and race conditions

### Test Files
- `tests/stable-locator.spec.ts` - Core functionality tests with static page
- `tests/dynamic-animation.spec.ts` - Tests with dynamically added/removed animations
- `tests/css-transitions.spec.ts` - Specific tests for CSS transitions and complex animations
- `tests/debug-locator.spec.ts` - Helper tests for debugging stability detection

## Debug Mode

This library includes a debug mode feature that can help diagnose issues with animations and transitions:

```typescript
import { setupStableLocatorSupport, setDefaultDebugMode } from 'playwright-stable-locator';

// Option 1: Enable debug mode globally when extending Playwright
setupStableLocatorSupport({ debug: true });

// Option 2: Enable or disable debug mode globally at any time
setDefaultDebugMode(true);

// Option 3: Enable debug mode for a specific locator
const locator = page.stableLocator('#animated-button', true);

// Option 4: Enable debug mode for a specific waitForStable call
await page.stableLocator('#animated-button').waitForStable({ 
  timeout: 5000,
  debug: true
});
```

When debug mode is enabled, the library will output detailed logs about:
- Element visibility state
- Animation state detection
- Position changes
- CSS animation and transition properties
- Stability check results

These logs can be extremely helpful when diagnosing why an element is not being detected as stable.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.