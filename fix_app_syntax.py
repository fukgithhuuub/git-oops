import re

with open('js/app.js', 'r') as f:
    content = f.read()

# Make sure we don't have duplicated async declarations
content = content.replace("async async function getFilteredResults() {", "async function getFilteredResults() {")

# Find and replace the debounce usage to use async/await safely
content = content.replace("searchInput.addEventListener('input', debounce((e) => {", "searchInput.addEventListener('input', debounce(async (e) => {")
content = content.replace("updateURL();\n      renderResults();", "updateURL();\n      await renderResults();")
content = content.replace("updateURL();\n        renderResults();", "updateURL();\n        await renderResults();")

with open('js/app.js', 'w') as f:
    f.write(content)
