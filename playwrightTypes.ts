/**
 * Type definitions for Playwright extensions
 * This file contains all the type definitions that extend Playwright's types
 */

import { WaitForStableOptions } from './stableLocator';

// Extend Playwright's Locator interface
declare module '@playwright/test' {
  interface Locator {
    /**
     * Waits for the element to be in a stable state (not animating)
     * @param options Options for waiting, including timeout and custom stability check
     * @returns Promise that resolves when the element is stable
     */
    waitForStable(options?: WaitForStableOptions): Promise<void>;
  }
  
  // Add 'stable' to the valid states for waitFor
  interface LocatorWaitForOptions {
    /**
     * State to wait for
     * - 'attached' - wait for element to be present in DOM
     * - 'detached' - wait for element to not be present in DOM
     * - 'visible' - wait for element to have non-empty bounding box and no visibility:hidden
     * - 'hidden' - wait for element to be detached from DOM, or have empty bounding box or visibility:hidden
     * - 'stable' - wait for element to stop animating or moving
     */
    state?: 'attached' | 'detached' | 'visible' | 'hidden' | 'stable';
    
    /**
     * Maximum time to wait in milliseconds
     * @default 30000
     */
    timeout?: number;
    
    /**
     * Whether to enable debug mode for detailed logging
     */
    debug?: boolean;
  }
}
