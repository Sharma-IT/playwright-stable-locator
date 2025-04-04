/**
 * This module exports utilities for extending Playwright with stable locator functionality
 */

// Re-export the StableLocator class and related tools for direct usage
export { StableLocator, setDefaultDebugMode, getDefaultDebugMode } from './stableLocator';
export { createStableLocator } from './createStableLocator';
export type { StableLocatorType } from './createStableLocator';
export type { StabilityCheckResult, WaitForStableOptions } from './stableLocator';

// Re-export the type definitions for Playwright extensions
// This ensures consumers get the correct type definitions without needing to use type assertions
export * from './playwrightTypes';

// Configuration object for global settings
export const config = {
  /**
   * Enable or disable debug mode globally
   * When true, detailed logs will be output during stability checks
   */
  set debugMode(value: boolean) {
    setDefaultDebugMode(value);
  },

  /**
   * Get current debug mode setting
   */
  get debugMode(): boolean {
    return getDefaultDebugMode();
  }
};

// Import the setDefaultDebugMode function from stableLocator
import { setDefaultDebugMode, getDefaultDebugMode } from './stableLocator';

/**
 * Sets up Playwright with the ability to wait for elements to be stable (not animating)
 *
 * @param options Configuration options
 * @param options.debug Whether to enable debug mode for detailed logging (default: false)
 */
export function setupStableLocatorSupport(options: { debug?: boolean } = {}): void {
  // Set debug mode if specified
  if (options.debug !== undefined) {
    setDefaultDebugMode(options.debug);
  }

  // Output a message indicating setup was applied
  if (getDefaultDebugMode()) {
    console.log('Playwright stable locator support initialized');
  }

  // The actual implementation happens in createStableLocator.ts.
  // Tests will import { createStableLocator } directly and apply it to locators.
}