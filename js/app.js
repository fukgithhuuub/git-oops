// Watermarked by https://github.com/pavnxet/git-oops
/**
 * App logic for the homepage (search, filtering, category selection)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await window.dataService.loadData();

  if (!data || data.length === 0) return;

  const searchInput = document.getElementById('search-input');
  const resultsGrid = document.getElementById('results-grid');
  const resultsCount = document.getElementById('results-count');
  const clearFilterBtn = document.getElementById('clear-filter');
  const categoryTiles = document.querySelectorAll('.category-tile');
  const emptyState = document.getElementById('empty-state');

  // Set up Fuse.js for fuzzy search
  const fuseOptions = {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'tags', weight: 0.3 },
      { name: 'description', weight: 0.1 }
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 2
  };
  const fuse = new Fuse(data, fuseOptions);

  let currentCategory = null;
  let currentSearchTerm = '';

  // Initialization
  initialize();

  function initialize() {
    // Check URL params for pre-filling search or category
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    const catParam = urlParams.get('category');

    if (queryParam) {
      currentSearchTerm = queryParam;
      searchInput.value = currentSearchTerm;
    }

    if (catParam) {
      currentCategory = catParam;
      updateCategoryUI(currentCategory);
    }

    renderResults();

    // Event listeners
    searchInput.addEventListener('input', debounce((e) => {
      currentSearchTerm = e.target.value;
      updateURL();
      renderResults();
    }, 200));

    // Keyboard shortcut to focus search (press '/')
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    categoryTiles.forEach(tile => {
      tile.addEventListener('click', () => {
        const category = tile.dataset.category;

        // Toggle category
        if (currentCategory === category) {
          currentCategory = null;
        } else {
          currentCategory = category;
        }

        updateCategoryUI(currentCategory);
        updateURL();
        renderResults();
      });
    });

    clearFilterBtn.addEventListener('click', () => {
      currentCategory = null;
      currentSearchTerm = '';
      searchInput.value = '';
      updateCategoryUI(null);
      updateURL();
      renderResults();
    });
  }

  function updateCategoryUI(category) {
    categoryTiles.forEach(tile => {
      if (tile.dataset.category === category) {
        tile.classList.add('active');
      } else {
        tile.classList.remove('active');
      }
    });
  }

  function updateURL() {
    const url = new URL(window.location);

    if (currentSearchTerm) {
      url.searchParams.set('q', currentSearchTerm);
    } else {
      url.searchParams.delete('q');
    }

    if (currentCategory) {
      url.searchParams.set('category', currentCategory);
    } else {
      url.searchParams.delete('category');
    }

    window.history.replaceState({}, '', url);
  }

  function getFilteredResults() {
    let results = data;

    // Apply search filter
    if (currentSearchTerm.trim() !== '') {
      const fuseResults = fuse.search(currentSearchTerm);
      results = fuseResults.map(result => result.item);
    }

    // Apply category filter
    if (currentCategory) {
      results = results.filter(item => item.category === currentCategory);
    }

    return results;
  }

  function renderResults() {
    const results = getFilteredResults();

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
    } else {
      emptyState.classList.add('hidden');
      resultsGrid.innerHTML = results.map(createScenarioCard).join('');
    }
  }

  function createScenarioCard(scenario) {
    const dangerClass = `badge-danger-${scenario.danger}`;
    const dangerLabel = getDangerLabel(scenario.danger);

    return `
      <a href="scenario.html?id=${scenario.id}" class="scenario-card">
        <div class="card-header">
          <h3 class="card-title">${escapeHTML(scenario.title)}</h3>
          <div class="card-badges">
            <span class="badge ${dangerClass}">${dangerLabel}</span>
          </div>
        </div>
        <p class="card-description">${escapeHTML(scenario.description)}</p>
      </a>
    `;
  }

  function getDangerLabel(danger) {
    switch(danger) {
      case 'safe': return '🟢 Safe';
      case 'caution': return '🟡 Caution';
      case 'destructive': return '🔴 Destructive';
      default: return danger;
    }
  }

  // Utilities
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
