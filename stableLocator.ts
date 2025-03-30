import { Locator, Page } from '@playwright/test';

// Define stability check result interface
export interface StabilityCheckResult {
  isStable: boolean;
  details?: {
    hasActiveAnimation?: boolean;
    animationName?: string;
    animationPlayState?: string;
    transitionProperty?: string;
    transitionDuration?: string;
    positionChanged?: boolean;
    initialRect?: DOMRect;
    newRect?: DOMRect;
    [key: string]: any;
  };
}

// Define options for waitForStable
export interface WaitForStableOptions {
  timeout?: number;
  debug?: boolean;
  isStable?: (element: Locator, defaultCheck: () => Promise<StabilityCheckResult>) => Promise<boolean>;
}

// Default setting for debug mode - can be changed globally
let DEFAULT_DEBUG_MODE = false;

/**
 * Set the default debug mode globally for all StableLocator instances
 * @param enabled Whether debug mode should be enabled by default
 */
export function setDefaultDebugMode(enabled: boolean): void {
  DEFAULT_DEBUG_MODE = enabled;
}

/**
 * Get the current default debug mode setting
 */
export function getDefaultDebugMode(): boolean {
  return DEFAULT_DEBUG_MODE;
}

export class StableLocator {
  private locator: Locator;
  private debugMode: boolean;
  
  constructor(locator: Locator, debugMode: boolean = DEFAULT_DEBUG_MODE) {
    this.locator = locator;
    this.debugMode = debugMode;
  }

  /**
   * Log a message only if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  /**
   * Log an error message only if debug mode is enabled
   */
  private logError(...args: any[]): void {
    if (this.debugMode) {
      console.error(...args);
    }
  }

  /**
   * Waits for the element to be in a stable state (not animating)
   * @param options Options for waiting, including timeout and custom stability check
   * @returns Promise that resolves when the element is stable
   */
  async waitForStable(options: WaitForStableOptions = {}): Promise<void> {
    const timeout = options.timeout || 30000;
    const startTime = Date.now();
    
    // Override instance debug mode if specified in options
    if (options.debug !== undefined) {
      this.debugMode = options.debug;
    }
    
    // Get the page from the locator
    const page = this.locator.page();
    
    this.log(`Starting to check stability with timeout ${timeout}ms`);
    
    let checkCount = 0;
    
    while (Date.now() - startTime < timeout) {
      checkCount++;
      
      try {
        // Check if element is visible first
        const isVisible = await this.locator.isVisible().catch(() => false);
        if (!isVisible) {
          this.log(`Element not visible on check ${checkCount}, waiting...`);
          await page.waitForTimeout(100);
          continue;
        }
        
        this.log(`Element visible on check ${checkCount}, checking stability...`);
        
        // Use custom stability function if provided, otherwise use default
        let stable = false;
        if (options.isStable) {
          // Create a wrapper for the default check that returns the detailed result
          const defaultCheckWrapper = async (): Promise<StabilityCheckResult> => {
            const result = await this.isStable();
            return {
              isStable: result.stable,
              details: result.details
            };
          };
          
          stable = await options.isStable(this.locator, defaultCheckWrapper);
        } else {
          // Use default stability check
          const isStable = await this.isStable();
          stable = isStable.stable;
        }
        
        this.log(`Stability check ${checkCount} result: ${stable}`);
        
        if (stable) {
          this.log(`Element is stable after ${Date.now() - startTime}ms`);
          return;
        }
      } catch (error) {
        // Log error but continue trying
        this.logError(`Error on check ${checkCount}:`, error);
      }
      
      // Wait a short time before checking again
      await page.waitForTimeout(100);
    }
    
    const elapsedTime = Date.now() - startTime;
    this.log(`Timeout after ${elapsedTime}ms and ${checkCount} checks`);
    throw new Error(`Locator not stable after ${timeout}ms (${checkCount} checks)`);
  }
  
  /**
   * Checks if an element is stable (not being animated)
   * @returns Promise with stability result and details
   */
  private async isStable(): Promise<{ stable: boolean, details: any }> {
    try {
      // First check if the element exists
      const exists = await this.locator.count() > 0;
      if (!exists) {
        this.log('Element does not exist');
        return { stable: false, details: { exists: false } };
      }
      
      // Get the element's handle with a shorter timeout
      this.log('Getting element handle...');
      const elementHandle = await this.locator.elementHandle({ timeout: 1000 }).catch((e) => {
        this.log('Error getting element handle:', e);
        return null;
      });
      
      if (!elementHandle) {
        this.log('Failed to get element handle');
        return { stable: false, details: { hasElementHandle: false } };
      }
      
      try {
        // Use the handle to evaluate the element's stability with a timeout
        this.log('Evaluating element stability...');
        
        // We need to pass the debug flag to the browser context
        const debug = this.debugMode;
        
        const result = await Promise.race([
          elementHandle.evaluate(async (element, debug) => {
            // Helper function to log only in debug mode
            const log = (...args: any[]) => {
              if (debug) {
                console.log(...args);
              }
            };
            
            // Record initial position and size
            const initialRect = element.getBoundingClientRect();
            
            // Wait a small amount of time
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Check if position, size, or other properties have changed
            const newRect = element.getBoundingClientRect();
            
            // Check for CSS animations and transitions
            const computedStyle = window.getComputedStyle(element);
            
            // Check if there's an animation but it's paused
            const animationName = computedStyle.animationName;
            const animationPlayState = computedStyle.animationPlayState;
            const transitionProperty = computedStyle.transitionProperty;
            const transitionDuration = computedStyle.transitionDuration;
            
            // An element is considered to have active animation if:
            // 1. It has an animation name other than 'none' AND animation play state is not 'paused'
            // 2. It has a transition property other than 'all' or 'none' with non-zero duration
            const hasActiveAnimation = 
              (animationName !== 'none' && animationPlayState !== 'paused') || 
              (transitionProperty !== 'all' && transitionProperty !== 'none' && transitionDuration !== '0s');
            
            // Check for changes in position or size
            const positionChanged = 
              initialRect.top !== newRect.top || 
              initialRect.left !== newRect.left ||
              initialRect.width !== newRect.width ||
              initialRect.height !== newRect.height;
            
            // Only log if debug mode is enabled
            log('[Element stability check]:', {
              hasActiveAnimation,
              animationName, 
              animationPlayState,
              transitionProperty,
              transitionDuration,
              positionChanged,
              initialPosition: { top: initialRect.top, left: initialRect.left },
              newPosition: { top: newRect.top, left: newRect.left }
            });
            
            // Return detailed info for debugging
            return {
              stable: !hasActiveAnimation && !positionChanged,
              details: {
                hasActiveAnimation,
                animationName,
                animationPlayState,
                transitionProperty,
                transitionDuration,
                positionChanged,
                initialRect: {
                  top: initialRect.top,
                  left: initialRect.left,
                  width: initialRect.width,
                  height: initialRect.height
                },
                newRect: {
                  top: newRect.top,
                  left: newRect.left,
                  width: newRect.width,
                  height: newRect.height
                }
              }
            };
          }, debug),
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Evaluate timeout')), 2000)
          )
        ]);
        
        if (typeof result === 'boolean') {
          return { stable: result, details: {} };
        } else {
          // We got the detailed result object
          return result as { stable: boolean, details: any };
        }
      } catch (error: unknown) {
        this.logError('Error in stability evaluation:', error);
        return { stable: false, details: { error: error instanceof Error ? error.toString() : String(error) } };
      } finally {
        await elementHandle.dispose().catch(() => {
          this.log('Error disposing element handle');
        });
      }
    } catch (error: unknown) {
      this.logError('Error in isStable:', error);
      return { stable: false, details: { error: error instanceof Error ? error.toString() : String(error) } };
    }
  }

  /**
   * Set debug mode for this StableLocator instance
   */
  setDebugMode(enabled: boolean): this {
    this.debugMode = enabled;
    return this;
  }
}

/**
 * Create a StableLocator from a regular Playwright Locator
 */
export function createStableLocator(locator: Locator, debug: boolean = DEFAULT_DEBUG_MODE): StableLocator {
  return new StableLocator(locator, debug);
}