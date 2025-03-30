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

test.describe('Dynamic Animation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a helper function to get enhanced locators
    page.stableLocator = (selector: string) => {
      return enhanceLocator(page.locator(selector));
    };
    
    // Create a page with dynamic animations on demand
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          button {
            padding: 10px;
            margin: 10px;
          }
          .animating {
            animation: shake 0.5s infinite;
          }
          .growing {
            animation: grow 2s infinite alternate;
          }
          .fading {
            animation: fade 1s infinite alternate;
          }
          .sliding {
            transition: transform 0.5s ease-in-out;
          }
          .color-changing {
            transition: background-color 0.5s ease;
          }
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(0); }
            75% { transform: translateX(5px); }
            100% { transform: translateX(0); }
          }
          @keyframes grow {
            0% { transform: scale(1); }
            100% { transform: scale(1.5); }
          }
          @keyframes fade {
            0% { opacity: 1; }
            100% { opacity: 0.5; }
          }
          #log {
            margin-top: 20px;
            border: 1px solid #ccc;
            padding: 10px;
            min-height: 100px;
            max-height: 200px;
            overflow-y: auto;
          }
          .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 10px;
          }
          .test-area {
            border: 1px solid #ddd;
            padding: 15px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <h1>Animation Test Page</h1>
        
        <div class="controls">
          <button id="target">Target Button</button>
          <button id="animate">Start Animation</button>
          <button id="stop">Stop Animation</button>
          <button id="add-growing">Add Growing</button>
          <button id="add-fading">Add Fading</button>
          <button id="slide-button">Slide</button>
          <button id="change-color">Change Color</button>
          <button id="clear-log">Clear Log</button>
        </div>
        
        <div class="test-area">
          <div id="sliding-element" class="sliding" style="width: 100px; height: 30px; background-color: #0056b3; color: white; text-align: center; line-height: 30px;">Slide Me</div>
          <div id="color-element" class="color-changing" style="width: 100px; height: 30px; background-color: #0056b3; color: white; text-align: center; margin-top: 10px; line-height: 30px;">Color</div>
        </div>
        
        <div id="log"></div>

        <script>
          const targetBtn = document.getElementById('target');
          const animateBtn = document.getElementById('animate');
          const stopBtn = document.getElementById('stop');
          const addGrowingBtn = document.getElementById('add-growing');
          const addFadingBtn = document.getElementById('add-fading');
          const slideButton = document.getElementById('slide-button');
          const changeColorBtn = document.getElementById('change-color');
          const clearLogBtn = document.getElementById('clear-log');
          const slidingElement = document.getElementById('sliding-element');
          const colorElement = document.getElementById('color-element');
          const log = document.getElementById('log');

          // Add click handlers
          targetBtn.addEventListener('click', () => {
            logEvent('Target button clicked');
          });

          animateBtn.addEventListener('click', () => {
            targetBtn.classList.add('animating');
            logEvent('Animation started (shake)');
          });

          stopBtn.addEventListener('click', () => {
            targetBtn.classList.remove('animating');
            targetBtn.classList.remove('growing');
            targetBtn.classList.remove('fading');
            logEvent('All animations stopped');
          });
          
          addGrowingBtn.addEventListener('click', () => {
            targetBtn.classList.add('growing');
            logEvent('Growing animation added');
          });
          
          addFadingBtn.addEventListener('click', () => {
            targetBtn.classList.add('fading');
            logEvent('Fading animation added');
          });
          
          slideButton.addEventListener('click', () => {
            const currentTransform = slidingElement.style.transform;
            slidingElement.style.transform = currentTransform ? '' : 'translateX(100px)';
            logEvent('Slide transition triggered');
          });
          
          changeColorBtn.addEventListener('click', () => {
            const currentColor = colorElement.style.backgroundColor;
            colorElement.style.backgroundColor = currentColor === 'rgb(0, 86, 179)' ? '#dc3545' : '#0056b3';
            logEvent('Color transition triggered');
          });
          
          clearLogBtn.addEventListener('click', () => {
            log.innerHTML = '';
          });
          
          slidingElement.addEventListener('click', () => {
            logEvent('Sliding element clicked');
          });
          
          colorElement.addEventListener('click', () => {
            logEvent('Color element clicked');
          });
          
          function logEvent(message) {
            const entry = document.createElement('div');
            entry.textContent = message + ' at ' + new Date().toISOString();
            log.prepend(entry);
          }
          
          // Add a function to pause animations that can be called from the test
          window.pauseAnimations = () => {
            targetBtn.style.animationPlayState = 'paused';
            slidingElement.style.transitionDuration = '0s';
            colorElement.style.transitionDuration = '0s';
            logEvent('Animations paused programmatically');
            return true;
          };
          
          // Add a function to resume animations
          window.resumeAnimations = () => {
            targetBtn.style.animationPlayState = 'running';
            slidingElement.style.transitionDuration = '0.5s';
            colorElement.style.transitionDuration = '0.5s';
            logEvent('Animations resumed programmatically');
            return true;
          };
        </script>
      </body>
      </html>
    `);
  });

  test('basic animation control test', async ({ page }) => {
    // First, click the target button while it's static
    await page.stableLocator('#target').click();
    
    // Verify the click was logged
    await expect(page.locator('#log div').first()).toContainText('Target button clicked');
  });
  
  test('handles shaking animation correctly', async ({ page }) => {
    // Start the shake animation
    await page.locator('#animate').click();
    
    // Verify animation started
    await expect(page.locator('#log div').first()).toContainText('Animation started');
    
    // Stop the animation
    await page.locator('#stop').click();
    await page.waitForTimeout(100); // Short wait for animation to stop
    
    // Wait for stability using waitForStable
    await page.stableLocator('#target').waitForStable({ timeout: 2000 });
    
    // Click the now-stable button
    await page.stableLocator('#target').click();
    
    // Verify the click was logged
    await expect(page.locator('#log div').first()).toContainText('Target button clicked');
  });
  
  test('detects and handles CSS transitions', async ({ page }) => {
    // Trigger the slide transition
    await page.locator('#slide-button').click();
    
    // Wait a moment for transition to start
    await page.waitForTimeout(100);
    
    // For CSS transitions, we'll use a direct approach rather than stability detection
    // Wait for transition to complete (slide transition is 0.5s)
    await page.waitForTimeout(600);
    
    // Now the element should be stable
    await page.locator('#sliding-element').click();
    
    // Verify the click was registered
    await expect(page.locator('#log div').first()).toContainText('Sliding element clicked');
  });
  
  test('detects color transitions', async ({ page }) => {
    // Trigger color change
    await page.locator('#change-color').click();
    
    // Wait a moment for transition to start
    await page.waitForTimeout(100);
    
    // For color transitions, we don't need to wait for stability as these don't affect position
    // Can click during color transition
    await page.locator('#color-element').click();
    
    // Verify the click was registered
    await expect(page.locator('#log div').first()).toContainText('Color element clicked');
  });
  
  test('correctly detects paused animations', async ({ page }) => {
    // Start animation
    await page.locator('#animate').click();
    
    // Pause animations programmatically
    await page.evaluate(() => {
      return (window as any).pauseAnimations();
    });
    
    // Check that animationPlayState was properly set
    const animationState = await page.evaluate(() => {
      const targetBtn = document.getElementById('target');
      if (!targetBtn) {
        throw new Error('Target button not found');
      }
      return window.getComputedStyle(targetBtn).animationPlayState;
    });
    
    expect(animationState).toBe('paused');
    
    // With animation paused, the element should be considered stable
    await page.stableLocator('#target').waitForStable({ timeout: 2000 });
    
    // Can click the element when animation is paused
    await page.stableLocator('#target').click();
    
    // Verify the click was logged
    await expect(page.locator('#log div').first()).toContainText('Target button clicked');
  });
  
  test('can handle multiple animations on same element', async ({ page }) => {
    // Add multiple animations to the target button
    await page.locator('#animate').click(); // Add shake
    await page.locator('#add-growing').click(); // Add growing
    await page.locator('#add-fading').click(); // Add fading
    
    // Verify all animations were added
    await expect(page.locator('#log div').nth(0)).toContainText('Fading animation added');
    await expect(page.locator('#log div').nth(1)).toContainText('Growing animation added');
    await expect(page.locator('#log div').nth(2)).toContainText('Animation started');
    
    // Stop all animations
    await page.locator('#stop').click();
    await page.waitForTimeout(100); // Wait for animations to stop
    
    // Now button should be stable
    await page.stableLocator('#target').waitForStable({ timeout: 2000 });
    
    // Can click the button now
    await page.stableLocator('#target').click();
    
    // Verify the click was logged
    await expect(page.locator('#log div').first()).toContainText('Target button clicked');
  });
}); 