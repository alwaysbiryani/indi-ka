import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function runQA() {
    console.log('🚀 Starting Post-Deployment QA Agent...');

    // 1. Run Playwright Tests
    console.log('\n--- Running Playwright Tests ---');
    try {
        // We use --reporter=json to capture results for the reporting script
        execSync('npx playwright test', {
            stdio: 'inherit',
            env: { ...process.env, PW_TEST_HTML_REPORT_OPEN: 'never' }
        });
        console.log('✅ All tests passed!');
    } catch (error) {
        console.log('⚠️ Some tests failed. Proceedings to reporting...');
    }

    // 2. Measure Performance (Simple check)
    // We can extract this from Playwright traces if needed, but for now let's just log.
    console.log('\n--- Performance Metrics ---');
    // Simple check: we could run a specific test and log timing.
    // Playwright tests already report duration.

    // 3. Report to Linear
    console.log('\n--- Reporting Failures to Linear ---');
    try {
        execSync('npx ts-node qa-agent/scripts/report-failures.ts', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Failed to report to Linear:', error);
    }

    // 4. Check Known Issues Registry
    console.log('\n--- Known Issues Regression Status ---');
    const knownIssuesPath = path.join(__dirname, 'config/known-issues.json');
    if (fs.existsSync(knownIssuesPath)) {
        const knownIssues = JSON.parse(fs.readFileSync(knownIssuesPath, 'utf8'));
        const resultsPath = path.join(__dirname, 'results/results.json');

        if (fs.existsSync(resultsPath)) {
            const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            const allTestTitles = results.suites.flatMap((s: any) => s.specs.map((sp: any) => sp.title));

            knownIssues.forEach((issue: any) => {
                const testRan = allTestTitles.includes(issue.testName);
                const testFailed = results.suites.some((s: any) =>
                    s.specs.some((sp: any) => sp.title === issue.testName && sp.tests.some((t: any) => t.status === 'unexpected'))
                );

                if (testRan) {
                    if (testFailed) {
                        console.log(`❌ ${issue.id}: ${issue.description} - REGRESSED`);
                    } else {
                        console.log(`✅ ${issue.id}: ${issue.description} - PASSED`);
                    }
                } else {
                    console.log(`⚪ ${issue.id}: ${issue.description} - Test not found in results`);
                }
            });
        }
    }

    // 5. Output Summary Report
    console.log('\n--- QA Report Summary ---');
    const resultsPath = path.join(__dirname, 'results/results.json');
    if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        const passed = results.stats.expected;
        const failed = results.stats.unexpected + results.stats.flaky;
        console.log(`Total Tests: ${results.stats.total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);

        if (failed > 0) {
            console.log('\nSee detailed report at: qa-agent/results/html/index.html');
        }
    }

    console.log('\n🏁 QA Process Complete.');
}

runQA().catch(console.error);
