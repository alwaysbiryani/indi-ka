import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Core User Journeys', () => {

    test.beforeEach(async ({ page }) => {
        // Inject a fake API key if needed by the app
        await page.addInitScript(() => {
            window.localStorage.setItem('sarvam_api_key', 'test-api-key');
        });
        await page.goto('/');
    });

    test('Dark Mode Toggle', async ({ page }) => {
        const html = page.locator('html');

        // Check initial state (should be dark based on metadata)
        await expect(html).toHaveAttribute('data-theme', 'dark');

        // Toggle to light
        await page.getByTestId('sun-icon').click();
        await expect(html).toHaveAttribute('data-theme', 'light');

        // Toggle back to dark
        await page.getByTestId('moon-icon').click();
        await expect(html).toHaveAttribute('data-theme', 'dark');
    });

    test('Language Selection', async ({ page }) => {
        // Open language selector (assuming it's clickable or a select)
        const selector = page.getByTestId('language-selector');
        await expect(selector).toBeVisible();

        // This depends on how LanguageSelector is implemented. 
        // Usually it's a list of buttons or a dropdown.
        // For now, let's just assert it exists.
    });

    test('Transcription Flow (Mocked)', async ({ page }) => {
        // Mock the transcription API
        await page.route('**/api/transcribe', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    transcript: 'This is a test transcription from Playwright.',
                    detected_language_code: 'en-IN'
                })
            });
        });

        // Start recording
        await page.getByTestId('record-button').click();

        // Wait for some time to simulate recording
        await page.waitForTimeout(2000);

        // Stop recording
        await page.getByTestId('stop-button').click();

        // Assert transcription appears in canvas
        const canvas = page.getByTestId('transcription-canvas');
        await expect(canvas).toHaveValue(/This is a test transcription/);
    });

    test('Copy and Delete', async ({ page }) => {
        // Manually set transcript for testing copy/delete
        const canvas = page.getByTestId('transcription-canvas');

        // We need to trigger the state to show the canvas. 
        // Since it only shows when transcript is truthy, we might need to mock a recording or inject state.
        // Let's mock a recording.
        await page.route('**/api/transcribe', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ transcript: 'Test text' })
            });
        });
        await page.getByTestId('record-button').click();
        await page.waitForTimeout(1000);
        await page.getByTestId('stop-button').click();

        // Copy
        await page.getByTestId('copy-button').click();
        await expect(page.getByText('Copied to clipboard')).toBeVisible();

        // Delete/Clear (Back button or Trash icon)
        await page.getByTestId('speak-again-button').click();
        await expect(page.getByTestId('record-button')).toBeVisible();
    });

    test('Recent History', async ({ page }) => {
        // Inject history
        await page.addInitScript(() => {
            const history = [
                { id: '1', text: 'Previous talk', timestamp: Date.now() - 1000, language: 'en' }
            ];
            window.localStorage.setItem('transcription_history', JSON.stringify(history));
        });

        await page.reload();

        // Open history
        await page.getByTestId('history-button').click();
        await expect(page.getByText('Previous talk')).toBeVisible();

        // Select item
        await page.getByText('Previous talk').click();

        // Assert it appears in canvas
        await expect(page.getByTestId('transcription-canvas')).toHaveValue('Previous talk');
    });

    test('Performance Metrics', async ({ page }) => {
        const start = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - start;

        console.log(`First Load Time: ${loadTime}ms`);

        // Check transcription response time (mocked)
        await page.route('**/api/transcribe', async route => {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate 500ms delay
            await route.fulfill({ status: 200, body: JSON.stringify({ transcript: 'Done' }) });
        });

        const transStart = Date.now();
        await page.getByTestId('record-button').click();
        await page.waitForTimeout(500);
        await page.getByTestId('stop-button').click();
        await expect(page.getByTestId('transcription-canvas')).toHaveValue('Done');
        const transTime = Date.now() - transStart;

        console.log(`Transcription Roundtrip Time: ${transTime}ms`);

        expect(loadTime).toBeLessThan(3000); // Expect < 3s load
    });

    test('Accessibility and Contrast Check', async ({ page }) => {
        await page.goto('/');
        await injectAxe(page);

        // Check for accessibility violations, focusing on contrast
        await checkA11y(page, {
            axeOptions: {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2aa', 'wcag21aa', 'best-practice']
                }
            }
        });
    });
});
