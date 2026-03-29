// Git Oops AI Chatbox
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';

env.allowLocalModels = false;

// ================== FILL THESE 3 VALUES ==================
const EMAILJS_PUBLIC_KEY   = 'YOUR_PUBLIC_KEY_HERE';     // ← From EmailJS dashboard
const EMAILJS_SERVICE_ID   = 'YOUR_SERVICE_ID_HERE';     // ← Your EmailJS service
const EMAILJS_TEMPLATE_ID  = 'YOUR_TEMPLATE_ID_HERE';    // ← Template that sends to alive-anger-sizzle@duck.com
// =========================================================

// --- UI Components ---

function injectUI() {
  // Floating button
  const aiBtn = document.createElement('button');
  aiBtn.id = 'ai-chat-btn';
  aiBtn.className = 'ai-chat-btn';
  aiBtn.innerHTML = '🤖 Git AI';
  document.body.appendChild(aiBtn);

  // Consent Popup Overlay
  const popupOverlay = document.createElement('div');
  popupOverlay.id = 'ai-popup-overlay';
  popupOverlay.className = 'ai-popup-overlay hidden';
  popupOverlay.innerHTML = `
    <div class="ai-popup">
      <h3>Enable Git Oops AI Helper?</h3>
      <p>This runs a smart AI directly in your browser! It will download a ~60 MB model once, which is securely cached for 7 days.</p>
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

  // Chatbox
  const chatbox = document.createElement('div');
  chatbox.id = 'ai-chatbox';
  chatbox.className = 'ai-chatbox hidden';
  chatbox.innerHTML = `
    <div class="ai-chat-header">
      <span>🤖 Git AI Helper</span>
      <button id="ai-close-btn" class="ai-close-btn">&times;</button>
    </div>
    <div id="ai-chat-messages" class="ai-chat-messages">
      <div class="ai-message ai-message-bot">Hi! Describe your Git problem and I'll find the fix for you.</div>
    </div>
    <form id="ai-chat-form" class="ai-chat-input-container">
      <input type="text" id="ai-chat-input" class="ai-chat-input" placeholder="E.g., I accidentally pushed to main..." autocomplete="off">
      <button type="submit" class="ai-send-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </form>
  `;
  document.body.appendChild(chatbox);
}

document.addEventListener('DOMContentLoaded', () => {
    injectUI();
});

// --- State & Caching ---

function checkConsent() {
  const enabled = localStorage.getItem('ai_helper_enabled');
  const timestamp = localStorage.getItem('ai_helper_timestamp');

  if (enabled && timestamp) {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // Check if cache has expired
    if (now - parseInt(timestamp, 10) > sevenDaysMs) {
      localStorage.removeItem('ai_helper_enabled');
      localStorage.removeItem('ai_helper_timestamp');
      console.log('AI cache expired after 7 days.');
      return false;
    }
    return true; // Still within 7 days
  }

  return false;
}

function setConsent() {
  localStorage.setItem('ai_helper_enabled', 'true');
  localStorage.setItem('ai_helper_timestamp', Date.now().toString());
}

// --- Model Initialization & Progress ---

let extractorPipeline = null;
let isLoading = false;
let modelReady = false;

async function loadModel() {
    if (extractorPipeline) return; // already loaded

    isLoading = true;

    const progressArea = document.getElementById('ai-progress-area');
    const progressBar = document.getElementById('ai-progress-bar');
    const progressText = document.getElementById('ai-progress-text');
    const actionsArea = document.getElementById('ai-popup-actions');

    actionsArea.classList.add('hidden');
    progressArea.classList.remove('hidden');

    try {
        extractorPipeline = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
            progress_callback: (data) => {
                if (data.status === 'progress') {
                    // Update progress bar width and text
                    const percentage = Math.round((data.loaded / data.total) * 100);
                    progressBar.style.width = `${percentage}%`;
                    progressText.textContent = `Downloading ${data.file || 'model'} (${percentage}%)...`;
                }
            }
        });

        console.log("Model loaded successfully!");
        modelReady = true;

        // Hide popup completely, open chatbox
        document.getElementById('ai-popup-overlay').classList.add('hidden');
        document.getElementById('ai-chatbox').classList.remove('hidden');

        // Build index once model is ready
        await buildIndex();

    } catch (err) {
        console.error("Failed to load AI model:", err);
        progressText.textContent = "Error loading model. Please try again later.";
        progressText.style.color = "var(--color-accent)";
        progressBar.style.backgroundColor = "var(--color-accent)";
    } finally {
        isLoading = false;
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

// --- Search & Match Logic ---


// Helper function to compute cosine similarity between two vectors
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

async function findBestMatch(queryText) {
    if (!extractorPipeline || scenarioEmbeddings.length === 0) {
        return null; // Not ready
    }

    try {
        // Generate embedding for user query
        const queryResult = await extractorPipeline(queryText, { pooling: 'mean', normalize: true });
        const queryEmbedding = queryResult.data;

        let bestMatchId = null;
        let highestScore = -1;

        // Compare against all scenarios
        for (const item of scenarioEmbeddings) {
            const score = cosineSimilarity(queryEmbedding, item.embedding);
            if (score > highestScore) {
                highestScore = score;
                bestMatchId = item.id;
            }
        }

        // Threshold for a "good" match
        console.log(`Best match score: ${highestScore}`);
        if (highestScore > 0.75) {
            return bestMatchId;
        } else {
            return null; // No strong match found
        }
    } catch (err) {
        console.error("Error finding match:", err);
        return null;
    }
}

// --- Chat Handling & EmailJS Fallback ---

// Helper to add messages to the chat interface
function addMessage(text, isUser) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${isUser ? 'ai-message-user' : 'ai-message-bot'}`;
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll
}

// Fallback email using EmailJS REST API
async function sendEmailFallback(query) {
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
        }
    } catch (err) {
        console.error("EmailJS Error:", err);
    }
}

// Setup Event Listeners
function setupEvents() {
    const btnOpenChat = document.getElementById('ai-chat-btn');
    const btnCloseChat = document.getElementById('ai-close-btn');
    const popupOverlay = document.getElementById('ai-popup-overlay');
    const btnYes = document.getElementById('ai-btn-yes');
    const btnNo = document.getElementById('ai-btn-no');
    const chatForm = document.getElementById('ai-chat-form');
    const chatInput = document.getElementById('ai-chat-input');
    const chatbox = document.getElementById('ai-chatbox');

    btnOpenChat.addEventListener('click', () => {
        if (checkConsent()) {
            if (!modelReady && !isLoading) {
                // Should have loaded before, try again
                loadModel();
            } else if (modelReady) {
                chatbox.classList.remove('hidden');
                chatInput.focus();
            }
        } else {
            // Ask for consent
            popupOverlay.classList.remove('hidden');
        }
    });

    btnCloseChat.addEventListener('click', () => {
        chatbox.classList.add('hidden');
    });

    btnNo.addEventListener('click', () => {
        popupOverlay.classList.add('hidden');
    });

    btnYes.addEventListener('click', () => {
        setConsent();
        loadModel(); // Initiates download and shows progress bar
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        // Show user message
        addMessage(text, true);
        chatInput.value = '';

        if (!modelReady) {
            addMessage("Please wait, the AI model is still loading...", false);
            return;
        }

        // Processing indicator
        const typingId = 'typing-' + Date.now();
        const messagesContainer = document.getElementById('ai-chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'ai-message ai-message-bot';
        typingDiv.textContent = 'Thinking...';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Semantic Search
        const bestMatchId = await findBestMatch(text);

        // Remove typing indicator
        document.getElementById(typingId).remove();

        if (bestMatchId) {
            addMessage("Found it!", false);

            // Look for card in the DOM
            const targetCard = document.getElementById(`scenario-${bestMatchId}`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetCard.classList.remove('ai-highlight'); // reset if already highlighted
                // Trigger reflow to restart animation
                void targetCard.offsetWidth;
                targetCard.classList.add('ai-highlight');
            } else {
                addMessage("I found a match, but the card isn't visible on this page right now.", false);
            }
        } else {
            addMessage("Not on the site yet. I've notified the maintainer.", false);
            await sendEmailFallback(text);
        }
    });
}

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    // Only setup events if UI injected.
    // Ensure dataService loading is complete before interacting heavily,
    // but the UI listeners can be bound now.
    setTimeout(setupEvents, 100);

    // Auto load model if already consented
    if (checkConsent() && !isLoading && !modelReady) {
        // Preload in background without showing popup
        loadModelInBackground();
    }
});

async function loadModelInBackground() {
    if (extractorPipeline) return;
    isLoading = true;
    try {
        extractorPipeline = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
        modelReady = true;
        console.log("Model loaded in background!");
        await buildIndex();
    } catch(e) {
        console.error("Background load failed:", e);
    } finally {
        isLoading = false;
    }
}
