import { Locator } from '@playwright/test';
import { StableLocator, WaitForStableOptions, getDefaultDebugMode } from './stableLocator';

// Extend Playwright's Locator interface
declare module '@playwright/test' {
  interface Locator {
    waitForStable(options?: WaitForStableOptions): Promise<void>;
  }
  
  // Add 'stable' to the valid states for waitFor
  interface LocatorWaitForOptions {
    state?: 'attached' | 'detached' | 'visible' | 'hidden' | 'stable';
    debug?: boolean;
  }
}

/**
 * Enhances Playwright's Locator class with stable state functionality
 * @param locator The locator to enhance
 * @param debug Whether to enable debug mode (default: follows global setting)
 */
export function enhanceLocator(locator: Locator, debug?: boolean): Locator {
  // Determine debug mode (use parameter if specified, otherwise use global default)
  const debugMode = debug !== undefined ? debug : getDefaultDebugMode();
  
  // Add waitForStable method to the locator
  Object.defineProperty(locator, 'waitForStable', {
    value: async (options: WaitForStableOptions = {}) => {
      const stableLocator = new StableLocator(locator, debugMode);
      return stableLocator.waitForStable(options);
    },
    configurable: true,
  });

  // Enhance the original waitFor method to support 'stable' state
  const originalWaitFor = locator.waitFor;
  Object.defineProperty(locator, 'waitFor', {
    value: async (options: { state?: string, timeout?: number, debug?: boolean } = {}) => {
      if (options.state === 'stable') {
        const stableLocator = new StableLocator(locator, options.debug !== undefined ? options.debug : debugMode);
        return stableLocator.waitForStable({ timeout: options.timeout, debug: options.debug });
      }
      
      // Call the original waitFor for built-in states
      return originalWaitFor.call(locator, options as any);
    },
    configurable: true,
  });

  return locator;
}