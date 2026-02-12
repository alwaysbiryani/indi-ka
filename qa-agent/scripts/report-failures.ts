import { LinearClient } from '@linear/sdk';
import * as fs from 'fs';
import * as path from 'path';

const resultsPath = path.join(process.cwd(), 'qa-agent/results/results.json');
const apiKey = process.env.LINEAR_API_KEY;

// Debugging: Log available environment keys (sans values) to trace secret injection
console.log('Environment keys:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')));

if (!apiKey) {
    console.error('LINEAR_API_KEY is not set. Skipping Linear reporting.');
    process.exit(0);
}

const linearClient = new LinearClient({ apiKey });

async function reportFailures() {
    if (!fs.existsSync(resultsPath)) {
        console.log('No results file found at', resultsPath);
        return;
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    // Helper to recursively extract specs from suites
    function getAllSpecs(suites: any[]): any[] {
        return suites.flatMap(suite => {
            const specs = suite.specs || [];
            const childSpecs = suite.suites ? getAllSpecs(suite.suites) : [];
            return [...specs, ...childSpecs];
        });
    }

    const allSpecs = getAllSpecs(results.suites || []);

    const failures = allSpecs.flatMap((spec: any) =>
        spec.tests.filter((test: any) => test.status === 'unexpected' || test.status === 'fail')
            .map((test: any) => ({
                title: spec.title,
                file: spec.file, // Note: file might be up standard, but usually available on spec or suite. 
                // Playwright JSON spec doesn't strictly have file on spec, it's on the root suite. 
                // However, let's keep it simple. The description uses it.
                // Actually, file is usually on the root suite. 
                // We might lose specific file info if we flatten without tracking context. 
                // But spec.file is often populated in newer versions? 
                // Let's check. spec.file exists.
                error: test.results[0]?.error?.message || 'Unknown error',
                logs: test.results[0]?.stdout?.map((l: any) => l.text).join('\n') || '', // Fix logs mapping
                viewport: test.projectName,
                screenshots: test.results[0]?.attachments?.filter((a: any) => a.name === 'screenshot') || []
            }))
    );

    if (failures.length === 0) {
        console.log('✅ No failures to report.');
        return;
    }

    console.log(`Reporting ${failures.length} failures to Linear...`);

    // Get Team ID (usually needed)
    const teams = await linearClient.teams();
    const team = teams.nodes[0]; // Just picking the first team for now

    if (!team) {
        console.error('No Linear team found.');
        return;
    }

    for (const failure of failures) {
        const description = `
### failing test name
${failure.title}

### expected behavior
The test should pass successfully without errors.

### actual behavior
\`\`\`
${failure.error}
\`\`\`

### reproduction steps
1. Run \`npx playwright test ${failure.file}\`
2. Observer failure in ${failure.viewport} viewport.

### console logs
\`\`\`
${failure.logs || 'No console logs captured.'}
\`\`\`

### device viewport used
${failure.viewport}

---
*Reported automatically by Post-Deployment QA Agent*
`;

        await linearClient.createIssue({
            teamId: team.id,
            title: `[QA-FAIL] ${failure.title} on ${failure.viewport}`,
            description: description,
            labelIds: [], // Add relevant label IDs if known
        });

        console.log(`Created Linear issue for: ${failure.title}`);
    }
}

reportFailures().catch(console.error);
