import * as fs from 'fs';
import * as path from 'path';

const resultsPath = path.join(process.cwd(), 'qa-agent/results/mock-results.json');

function reportFailures() {
    if (!fs.existsSync(resultsPath)) {
        console.log('No mock results file found at', resultsPath);
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

    console.log(`Found ${allSpecs.length} specs total.`);

    const failures = allSpecs.flatMap((spec: any) =>
        spec.tests.filter((test: any) => test.status === 'unexpected' || test.status === 'fail')
            .map((test: any) => ({
                title: spec.title,
                viewport: test.projectName
            }))
    );

    if (failures.length === 0) {
        console.log('✅ No failures found in parser logic.');
    } else {
        console.log(`❌ Found ${failures.length} failures:`);
        failures.forEach((f: any) => console.log(`- ${f.title} on ${f.viewport}`));
    }
}

reportFailures();
