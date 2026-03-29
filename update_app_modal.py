import re

with open('js/app.js', 'r') as f:
    content = f.read()

# 1. Update initialize() event listeners to include modal logic
modal_logic = '''
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

  }'''

content = content.replace('''
    // AI Toggle Event Listener
    const aiToggle = document.getElementById('ai-toggle');
    const aiStatus = document.getElementById('ai-status');

    if (aiToggle) {
      aiToggle.addEventListener('change', async (e) => {
        aiModeEnabled = e.target.checked;
        if (aiModeEnabled && !aiModelReady && !aiModelLoading) {
          await initAI();
        } else {
          renderResults();
        }
      });
    }

  }''', modal_logic)

# 2. Update initAI() to include progress_callback, localStorage, and close modal
init_ai_logic = '''
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
  }'''

content = content.replace('''
  async function initAI() {
    if (aiModelReady || aiModelLoading) return;

    aiModelLoading = true;
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) aiStatus.textContent = "(Loading model...)";

    try {
      // Configure transformers.js to use browser cache and no local path
      window.transformers.env.allowLocalModels = false;
      window.transformers.env.useBrowserCache = true;

      // Load feature extraction pipeline
      featureExtractor = await window.transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

      if (aiStatus) aiStatus.textContent = "(Generating embeddings...)";

      // Pre-compute embeddings for all scenarios
      await generateScenarioEmbeddings();

      aiModelReady = true;
      if (aiStatus) aiStatus.textContent = "(Ready)";
      setTimeout(() => {
        if (aiStatus) aiStatus.textContent = "";
      }, 3000);

      // Trigger a re-render now that AI is ready
      renderResults();
    } catch (err) {
      console.error("Error initializing AI model:", err);
      if (aiStatus) aiStatus.textContent = "(Error loading model)";
      document.getElementById('ai-toggle').checked = false;
      aiModeEnabled = false;
    } finally {
      aiModelLoading = false;
    }
  }''', init_ai_logic)

with open('js/app.js', 'w') as f:
    f.write(content)
