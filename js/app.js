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

  // AI State variables
  let aiModeEnabled = false;
  let aiModelLoading = false;
  let aiModelReady = false;
  let featureExtractor = null;
  let scenarioEmbeddings = [];


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

    // AI Toggle Event Listener
    const aiToggle = document.getElementById('ai-toggle');
    const aiStatus = document.getElementById('ai-status');
    const aiModal = document.getElementById('ai-modal');
    const modalCancel = document.getElementById('modal-cancel');
    const modalAccept = document.getElementById('modal-accept');

    if (aiToggle) {
      aiToggle.addEventListener('change', async (e) => {
        const isChecked = e.target.checked;

        if (isChecked && !aiModelReady && !aiModelLoading) {
          // Check expiration first before proceeding
          await checkCacheExpiration();
          // Show modal to confirm download
          aiModal.classList.remove('hidden');
        } else if (isChecked && aiModelReady) {
          aiModeEnabled = true;
          renderResults();
        } else if (!isChecked) {
          aiModeEnabled = false;
          renderResults();
        }
      });

      modalCancel.addEventListener('click', () => {
        aiModal.classList.add('hidden');
        aiToggle.checked = false;
      });

      modalAccept.addEventListener('click', async () => {
        aiModeEnabled = true;

        // Hide modal actions and show progress
        document.getElementById('modal-actions').classList.add('hidden');
        document.getElementById('progress-container').classList.remove('hidden');

        await initAI();
      });
    }

  }


  async function checkCacheExpiration() {
    const cacheDateStr = localStorage.getItem('ai_model_date');
    if (cacheDateStr) {
      const cacheDate = parseInt(cacheDateStr, 10);
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - cacheDate > SEVEN_DAYS_MS) {
        console.log("AI Model cache expired. Clearing...");
        localStorage.removeItem('ai_model_date');
        try {
            await caches.delete('transformers-cache');
        } catch(e) {
            console.error("Failed to delete cache:", e);
        }
      }
    }
  }

  async function initAI() {
    if (aiModelReady || aiModelLoading) return;

    aiModelLoading = true;
    const aiStatus = document.getElementById('ai-status');
    const aiModal = document.getElementById('ai-modal');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (aiStatus) aiStatus.textContent = "(Loading model...)";

    try {
      window.transformers.env.allowLocalModels = false;
      window.transformers.env.useBrowserCache = true;

      featureExtractor = await window.transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (info) => {
          if (info.status === 'progress' || info.status === 'downloading') {
            const progress = info.progress !== undefined ? info.progress : 0;
            const percentage = Math.round(progress);
            if (progressFill) progressFill.style.width = `${percentage}%`;
            if (progressText) progressText.textContent = `Downloading... ${percentage}%`;
          } else if (info.status === 'done') {
            if (progressFill) progressFill.style.width = `100%`;
            if (progressText) progressText.textContent = `Processing model...`;
          }
        }
      });

      // Save current date to localStorage to manage 7-day expiration
      localStorage.setItem('ai_model_date', Date.now().toString());

      if (aiStatus) aiStatus.textContent = "(Generating embeddings...)";
      if (progressText) progressText.textContent = "Generating embeddings...";

      await generateScenarioEmbeddings();

      aiModelReady = true;
      if (aiStatus) aiStatus.textContent = "(Ready)";

      // Hide Modal completely and reset states
      if (aiModal) aiModal.classList.add('hidden');
      document.getElementById('modal-actions').classList.remove('hidden');
      progressContainer.classList.add('hidden');
      if (progressFill) progressFill.style.width = `0%`;

      setTimeout(() => {
        if (aiStatus) aiStatus.textContent = "";
      }, 3000);

      renderResults();
    } catch (err) {
      console.error("Error initializing AI model:", err);
      if (aiStatus) aiStatus.textContent = "(Error loading model)";
      document.getElementById('ai-toggle').checked = false;
      aiModeEnabled = false;

      // Reset UI on error
      if (progressText) progressText.textContent = "Error occurred. Check console.";
      setTimeout(() => {
          if (aiModal) aiModal.classList.add('hidden');
          document.getElementById('modal-actions').classList.remove('hidden');
          progressContainer.classList.add('hidden');
      }, 2000);
    } finally {
      aiModelLoading = false;
    }
  }

  async function generateScenarioEmbeddings() {
    scenarioEmbeddings = [];
    for (const scenario of data) {
      const textToEmbed = `${scenario.title} ${scenario.tags.join(' ')} ${scenario.description}`;
      const output = await featureExtractor(textToEmbed, { pooling: 'mean', normalize: true });
      scenarioEmbeddings.push({
        id: scenario.id,
        embedding: Array.from(output.data)
      });
    }
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


  function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async function getFilteredResults() {
    let results = data;

    // Apply search filter
    if (currentSearchTerm.trim() !== '') {
      if (aiModeEnabled && aiModelReady && featureExtractor) {
        // AI Semantic Search
        try {
          const queryEmbeddingOutput = await featureExtractor(currentSearchTerm, { pooling: 'mean', normalize: true });
          const queryEmbedding = Array.from(queryEmbeddingOutput.data);

          const scoredResults = results.map(scenario => {
            const scenarioEmbObj = scenarioEmbeddings.find(se => se.id === scenario.id);
            if (!scenarioEmbObj) return { scenario, score: -1 };
            const score = cosineSimilarity(queryEmbedding, scenarioEmbObj.embedding);
            return { scenario, score };
          });

          scoredResults.sort((a, b) => b.score - a.score);

          // Filter to top relevance threshold
          const threshold = 0.3; // Minimum similarity threshold
          results = scoredResults
            .filter(item => item.score > threshold)
            .map(item => item.scenario);

          // If no results above threshold, show top 3 anyway
          if (results.length === 0) {
              results = scoredResults.slice(0, 3).map(item => item.scenario);
          }
        } catch (e) {
            console.error("AI Search Failed, falling back to keyword search", e);
            const fuseResults = fuse.search(currentSearchTerm);
            results = fuseResults.map(result => result.item);
        }
      } else {
        // Fallback to Fuse Keyword Search
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

  async function renderResults() {
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
