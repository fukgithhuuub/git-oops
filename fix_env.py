import re

with open('js/ai-chat.js', 'r') as f:
    content = f.read()

# Make sure env.allowLocalModels = false; is at the top to stop the 404s
if 'env.allowLocalModels = false;' not in content:
    content = content.replace("import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';", "import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';\n\nenv.allowLocalModels = false;")

with open('js/ai-chat.js', 'w') as f:
    f.write(content)
