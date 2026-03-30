import re

with open('js/app.js', 'r') as f:
    content = f.read()

content = content.replace("tile.addEventListener('click', () => {", "tile.addEventListener('click', async () => {")
content = content.replace("clearFilterBtn.addEventListener('click', () => {", "clearFilterBtn.addEventListener('click', async () => {")

# Also make initialize async
content = content.replace("function initialize() {", "async function initialize() {")
content = content.replace("initialize();", "await initialize();")

with open('js/app.js', 'w') as f:
    f.write(content)
