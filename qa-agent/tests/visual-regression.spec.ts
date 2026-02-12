import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {

    test('Home Screen - Desktop', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Only run visual regression on Chromium to avoid slight rendering differences across engines');

        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');

        // Wait for animations to settle
        await page.waitForTimeout(2000);

        await expect(page).toHaveScreenshot('home-desktop.png', {
            maxDiffPixelRatio: 0.05, // Allow some minor differences (e.g. anti-aliasing)
        });
    });

    test('Home Screen - Mobile', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Only run on mobile viewports');

        await page.goto('/');

        // Wait for animations to settle
        await page.waitForTimeout(2000);

        await expect(page).toHaveScreenshot('home-mobile.png', {
            maxDiffPixelRatio: 0.05,
        });
    });

    test('History Sidebar', async ({ page }) => {
        await page.addInitScript(() => {
            const history = [
                { id: '1', text: 'Test history item 1', timestamp: Date.now(), language: 'en' }
            ];
            window.localStorage.setItem('transcription_history', JSON.stringify(history));
        });

        await page.goto('/');
        await page.getByTestId('history-button').click();

        // Wait for sidebar animation
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot('history-sidebar.png', {
            mask: [page.locator('[data-testid="timestamp"]')], // Mask dynamic parts if any
            maxDiffPixelRatio: 0.05,
        });
    });
});
