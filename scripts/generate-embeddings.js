import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';

// Disable local models loading to force downloading from HF, or set local model path
env.allowLocalModels = false;

const SCENARIOS_PATH = path.join(process.cwd(), '../data/scenarios.json');
const EMBEDDINGS_PATH = path.join(process.cwd(), '../data/embeddings.json');

async function generateEmbeddings() {
    console.log("Loading Xenova/bge-small-en-v1.5 model...");
    const extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');

    console.log("Reading scenarios from", SCENARIOS_PATH);
    const scenariosRaw = fs.readFileSync(SCENARIOS_PATH, 'utf-8');
    const scenarios = JSON.parse(scenariosRaw);

    const embeddings = [];

    console.log(`Generating embeddings for ${scenarios.length} scenarios...`);
    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        const tagsString = scenario.tags ? scenario.tags.join(' ') : '';
        const textToEmbed = `${scenario.title} ${tagsString} ${scenario.description}`;

        const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });

        embeddings.push({
            id: scenario.id,
            embedding: Array.from(output.data)
        });

        process.stdout.write(`\rProcessed ${i + 1}/${scenarios.length}`);
    }

    console.log("\nSaving embeddings to", EMBEDDINGS_PATH);
    fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(embeddings, null, 2));
    console.log("Success! Embeddings generated.");
}

generateEmbeddings().catch(console.error);
