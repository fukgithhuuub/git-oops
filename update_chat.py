import re

with open('js/ai-chat.js', 'r') as f:
    content = f.read()

# 1. Update buildIndex to fetch pre-computed embeddings
new_build_index = """// --- Semantic Indexing ---

let scenarioEmbeddings = [];

async function buildIndex() {
    try {
        const response = await fetch('./data/embeddings.json');
        if (!response.ok) throw new Error('Failed to fetch embeddings.json');
        scenarioEmbeddings = await response.json();
        console.log(`Loaded pre-computed embeddings for ${scenarioEmbeddings.length} scenarios.`);
    } catch (err) {
        console.error("Error loading embeddings:", err);
    }
}
"""
content = re.sub(
    r'// --- Semantic Indexing ---.*?// --- Search & Match Logic ---',
    new_build_index + '\n// --- Search & Match Logic ---\n',
    content,
    flags=re.DOTALL
)

# 2. Update threshold from 0.6 to 0.75
content = content.replace('if (highestScore > 0.6) {', 'if (highestScore > 0.75) {')

with open('js/ai-chat.js', 'w') as f:
    f.write(content)

print("Updated js/ai-chat.js")
