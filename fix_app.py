import re

with open('js/app.js', 'r') as f:
    content = f.read()

# 1. Update debounce to handle async
debounce_func = """
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
"""

# 2. Add event listener to AI Toggle Button
ai_toggle = """
    // AI Toggle
    const aiToggleBtn = document.getElementById('ai-search-toggle');
    if (aiToggleBtn) {
      aiToggleBtn.addEventListener('click', () => {
        if (window.aiSearchReady) {
          // Already on, could disable but let's keep it simple or show status
          alert("AI Search is already active!");
        } else if (window.promptAIConsent) {
          window.promptAIConsent();
        }
      });
    }

    // Expose a way to re-trigger search from ai-search.js when model loads
    window.triggerSearchUpdate = () => {
      renderResults();
    };
"""

# 3. Update getFilteredResults to be async and use semanticSearch
get_filtered_async = """
  async function getFilteredResults() {
    let results = data;

    // Apply search filter
    if (currentSearchTerm.trim() !== '') {
      if (window.aiSearchReady && window.semanticSearch) {
        // AI Semantic Search
        const semanticMatches = await window.semanticSearch(currentSearchTerm);
        results = semanticMatches.map(match => dataService.getById(match.id)).filter(item => item !== undefined);
      } else {
        // Fallback to Fuse
        const fuseResults = fuse.search(currentSearchTerm);
        results = fuseResults.map(result => result.item);
      }
    }

    // Apply category filter
    if (currentCategory) {
      results = results.filter(item => item.category === currentCategory);
    }

    return results;
  }
"""

# 4. Update renderResults to be async
render_results_async = """
  async function renderResults() {
    // Show loading state if AI is loading
    if (window.isAILoading) {
        resultsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--color-text-muted);">AI model is loading... please wait.</div>';
        return;
    }

    const results = await getFilteredResults();

    // Update count and clear filter button visibility
    resultsCount.textContent = `Showing ${results.length} scenario${results.length !== 1 ? 's' : ''}`;

    if (currentCategory || currentSearchTerm) {
      clearFilterBtn.style.display = 'inline-block';
    } else {
      clearFilterBtn.style.display = 'none';
    }

    // Render cards or empty state
    if (results.length === 0) {
      resultsGrid.innerHTML = '';
      emptyState.classList.remove('hidden');

      // Update empty state text based on search term
      const h3 = emptyState.querySelector('h3');
      if (currentSearchTerm) {
          h3.textContent = `No solutions found for "${currentSearchTerm}"`;
          // The notify button logic is handled separately
      } else {
          h3.textContent = 'No solutions found';
      }
    } else {
      emptyState.classList.add('hidden');
      resultsGrid.innerHTML = results.map(createScenarioCard).join('');
    }
  }
"""

content = content.replace("function getFilteredResults() {", "async function getFilteredResults() {")
# We'll replace the bodies using regex or string replacement
content = re.sub(r'function getFilteredResults\(\) \{.*?\n  \}', get_filtered_async, content, flags=re.DOTALL)
content = re.sub(r'function renderResults\(\) \{.*?\n  \}', render_results_async, content, flags=re.DOTALL)

# Insert AI Toggle setup into initialize
content = content.replace("renderResults();\n\n    // Event listeners", "renderResults();\n\n" + ai_toggle + "\n    // Event listeners")

with open('js/app.js', 'w') as f:
    f.write(content)
