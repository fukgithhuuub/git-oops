import re

with open('index.html', 'r') as f:
    content = f.read()

# Update script tag
content = content.replace('<script type="module" src="js/ai-chat.js"></script>', '<script type="module" src="js/ai-search.js"></script>')

# Add toggle button next to search box
search_box_html = """
      <div class="search-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="search-input" class="search-input" placeholder="Describe what went wrong... (Press '/' to focus)" autocomplete="off">
        <button id="ai-search-toggle" class="ai-search-toggle" title="Enable AI Search">🤖 AI</button>
      </div>
"""
content = re.sub(r'<div class="search-container">.*?</div>', search_box_html, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)

with open('css/main.css', 'r') as f:
    css = f.read()

# Remove old chatbox css
css = re.sub(r'/\* AI Chatbox Styles \*/.*$', '', css, flags=re.DOTALL)

# Add new styles
new_css = """/* AI Search Styles */
.search-container {
  display: flex;
  align-items: center;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 1rem 3rem 1rem 3rem; /* adjusted for icon */
}

.ai-search-toggle {
  position: absolute;
  right: 0.5rem;
  background: var(--color-border);
  border: 1px solid transparent;
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius-btn);
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.ai-search-toggle:hover {
  background: var(--color-primary);
  color: white;
}

.ai-search-toggle.ai-active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 8px rgba(0,0,0,0.2);
}

.ai-popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-popup {
  background-color: var(--color-card-bg);
  border-radius: var(--border-radius-card);
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  text-align: center;
}

.ai-popup h3 {
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.ai-popup p {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.9375rem;
}

.ai-popup-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.ai-btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius-btn);
  cursor: pointer;
  font-weight: 500;
}

.ai-btn-secondary {
  background-color: var(--color-border);
  color: var(--color-text);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius-btn);
  cursor: pointer;
  font-weight: 500;
}

.ai-progress-container {
  width: 100%;
  background-color: var(--color-border);
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
  margin-top: 1rem;
}

.ai-progress-bar {
  height: 100%;
  background-color: var(--color-success);
  width: 0%;
  transition: width 0.3s;
}

/* Fallback button in empty state */
.notify-maintainer-btn {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius-btn);
  cursor: pointer;
  font-weight: 500;
  margin-top: 1rem;
}
.notify-maintainer-btn:hover {
  background-color: #2a2a4a;
}
"""

with open('css/main.css', 'w') as f:
    f.write(css + new_css)
