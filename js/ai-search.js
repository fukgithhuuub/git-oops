import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';

env.allowLocalModels = false;

// ================== FILL THESE 3 VALUES ==================
const EMAILJS_PUBLIC_KEY   = 'YOUR_PUBLIC_KEY_HERE';     // ← From EmailJS dashboard
const EMAILJS_SERVICE_ID   = 'YOUR_SERVICE_ID_HERE';     // ← Your EmailJS service
const EMAILJS_TEMPLATE_ID  = 'YOUR_TEMPLATE_ID_HERE';    // ← Template that sends to alive-anger-sizzle@duck.com
// =========================================================

// Global flags for app.js
window.aiSearchReady = false;
window.isAILoading = false;

// --- State & Caching ---
function checkConsent() {
  const enabled = localStorage.getItem('ai_helper_enabled');
  const timestamp = localStorage.getItem('ai_helper_timestamp');

  if (enabled && timestamp) {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (now - parseInt(timestamp, 10) > sevenDaysMs) {
      localStorage.removeItem('ai_helper_enabled');
      localStorage.removeItem('ai_helper_timestamp');
      console.log('AI cache expired after 7 days.');
      return false;
    }
    return true;
  }
  return false;
}

function setConsent() {
  localStorage.setItem('ai_helper_enabled', 'true');
  localStorage.setItem('ai_helper_timestamp', Date.now().toString());
}

// --- UI Injection for Popup ---
function injectConsentPopup() {
  const popupOverlay = document.createElement('div');
  popupOverlay.id = 'ai-popup-overlay';
  popupOverlay.className = 'ai-popup-overlay hidden';
  popupOverlay.innerHTML = `
    <div class="ai-popup">
      <h3>Enable Git Oops AI Search?</h3>
      <p>This runs a smart AI directly in your browser to power the search bar! It will download a ~60 MB model once, which is securely cached for 7 days.</p>
      <div id="ai-progress-area" class="hidden" style="margin-bottom: 1.5rem;">
        <p style="font-size: 0.85rem; color: var(--color-text-muted);" id="ai-progress-text">Downloading model (0%)...</p>
        <div class="ai-progress-container">
          <div id="ai-progress-bar" class="ai-progress-bar"></div>
        </div>
      </div>
      <div class="ai-popup-actions" id="ai-popup-actions">
        <button id="ai-btn-no" class="ai-btn-secondary">No, thanks</button>
        <button id="ai-btn-yes" class="ai-btn-primary">Yes, enable AI</button>
      </div>
    </div>
  `;
  document.body.appendChild(popupOverlay);
}

// --- Model Initialization & Progress ---
let extractorPipeline = null;

window.loadAIModel = async function() {
    if (extractorPipeline) return;

    window.isAILoading = true;

    const progressArea = document.getElementById('ai-progress-area');
    const progressBar = document.getElementById('ai-progress-bar');
    const progressText = document.getElementById('ai-progress-text');
    const actionsArea = document.getElementById('ai-popup-actions');

    if (actionsArea) actionsArea.classList.add('hidden');
    if (progressArea) progressArea.classList.remove('hidden');

    try {
        extractorPipeline = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
            progress_callback: (data) => {
                if (data.status === 'progress' && progressBar && progressText) {
                    const percentage = Math.round((data.loaded / data.total) * 100);
                    progressBar.style.width = `${percentage}%`;
                    progressText.textContent = `Downloading ${data.file || 'model'} (${percentage}%)...`;
                }
            }
        });

        console.log("Model loaded successfully!");

        await buildIndex();
        window.aiSearchReady = true;

        const overlay = document.getElementById('ai-popup-overlay');
        if (overlay) overlay.classList.add('hidden');

        // Update the toggle UI
        const toggleBtn = document.getElementById('ai-search-toggle');
        if (toggleBtn) toggleBtn.classList.add('ai-active');

        // Re-trigger search in app.js if a term exists
        if (window.triggerSearchUpdate) {
            window.triggerSearchUpdate();
        }

    } catch (err) {
        console.error("Failed to load AI model:", err);
        if (progressText) {
            progressText.textContent = "Error loading model. Please try again later.";
            progressText.style.color = "var(--color-accent)";
            progressBar.style.backgroundColor = "var(--color-accent)";
        }
    } finally {
        window.isAILoading = false;
    }
}

// --- Semantic Indexing ---
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

// --- Search Logic ---
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

window.semanticSearch = async function(queryText) {
    if (!extractorPipeline || scenarioEmbeddings.length === 0) {
        return [];
    }

    try {
        const queryResult = await extractorPipeline(queryText, { pooling: 'mean', normalize: true });
        const queryEmbedding = queryResult.data;

        let results = [];

        for (const item of scenarioEmbeddings) {
            const score = cosineSimilarity(queryEmbedding, item.embedding);
            if (score > 0.70) {
                results.push({ id: item.id, score: score });
            }
        }

        // Sort descending
        results.sort((a, b) => b.score - a.score);
        return results;
    } catch (err) {
        console.error("Error performing semantic search:", err);
        return [];
    }
}

// Fallback email using EmailJS REST API
window.sendEmailFallback = async function(query) {
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: {
                    query: query,
                    source: window.location.href
                }
            })
        });
        if (!response.ok) {
            console.error("Failed to send email fallback.");
            return false;
        }
        return true;
    } catch (err) {
        console.error("EmailJS Error:", err);
        return false;
    }
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    injectConsentPopup();

    const popupOverlay = document.getElementById('ai-popup-overlay');
    const btnYes = document.getElementById('ai-btn-yes');
    const btnNo = document.getElementById('ai-btn-no');

    btnNo.addEventListener('click', () => {
        popupOverlay.classList.add('hidden');
    });

    btnYes.addEventListener('click', () => {
        setConsent();
        window.loadAIModel();
    });

    // Expose prompt function to app.js
    window.promptAIConsent = function() {
        if (!checkConsent()) {
            popupOverlay.classList.remove('hidden');
        }
    };

    // Auto load model if already consented
    if (checkConsent() && !window.isAILoading && !window.aiSearchReady) {
        // Preload in background without showing popup
        (async () => {
            window.isAILoading = true;
            try {
                extractorPipeline = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
                await buildIndex();
                window.aiSearchReady = true;
                const toggleBtn = document.getElementById('ai-search-toggle');
                if (toggleBtn) toggleBtn.classList.add('ai-active');
                console.log("Model loaded in background!");
                if (window.triggerSearchUpdate) {
                    window.triggerSearchUpdate();
                }
            } catch(e) {
                console.error("Background load failed:", e);
            } finally {
                window.isAILoading = false;
            }
        })();
    }
});
