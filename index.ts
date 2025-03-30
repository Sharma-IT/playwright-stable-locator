/**
 * This module exports utilities for extending Playwright with stable locator functionality
 */

// Re-export the StableLocator class and related tools for direct usage
export { StableLocator, setDefaultDebugMode, getDefaultDebugMode } from './stableLocator';
export { enhanceLocator } from './enhancedLocator';
export type { StabilityCheckResult, WaitForStableOptions } from './stableLocator';

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
 * Extends Playwright with the ability to wait for elements to be stable (not animating)
 * 
 * @param options Configuration options
 * @param options.debug Whether to enable debug mode for detailed logging (default: false)
 */
export function extendPlaywright(options: { debug?: boolean } = {}): void {
  // Set debug mode if specified
  if (options.debug !== undefined) {
    setDefaultDebugMode(options.debug);
  }
  
  // Output a message indicating extension was applied
  if (getDefaultDebugMode()) {
    console.log('Playwright extended with stable locator functionality (debug mode: ON)');
  } else {
    console.log('Playwright extended with stable locator functionality');
  }
  
  // The actual implementation happens in enhancedLocator.ts.
  // Tests will import { enhanceLocator } directly and apply it to locators.
}