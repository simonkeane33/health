import { readVaultDir } from '../src/lib/vaultReader';
import { aggregateDailySummaries } from '../src/lib/aggregator';

async function main() {
    const result = await readVaultDir('/Users/simonkeane/mission-control/mission-control-vault/01-Me/Health/Daily');
    console.log('Files parsed:', result.allEntries.length);
    console.log('Food entries:', result.foodEntries.length);
    console.log('Weight entries:', result.weightEntries.length);
    console.log('Daily summaries:', result.dailySummaries.length);
    console.log('Errors:', result.errors.length);
    if (result.errors.length > 0) {
        console.log('First 3 errors:', result.errors.slice(0, 3));
    }

    if (result.dailySummaries.length > 0) {
        console.log('\nMost recent daily summary:');
        console.log(JSON.stringify(result.dailySummaries[0], null, 2));
    }

    const aggregated = aggregateDailySummaries(result.foodEntries, result.weightEntries, result.dailySummaries.slice(0, 3));
    console.log('\nAggregated days count:', aggregated.length);
    if (aggregated.length > 0) {
        console.log('Most recent aggregated day:');
        console.log(JSON.stringify(aggregated[0], null, 2));
    }
}

main().catch(console.error);
