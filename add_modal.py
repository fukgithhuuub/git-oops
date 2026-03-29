import re

with open('index.html', 'r') as f:
    content = f.read()

modal_html = '''
  <div id="ai-modal" class="modal hidden">
    <div class="modal-content">
      <h2>Enable AI Semantic Search?</h2>
      <p>Turning this on will download a lightweight AI model (~23MB) directly to your browser. This allows you to search using natural language instead of just keywords.</p>
      <p>The model runs entirely on your device (no data leaves your computer) and will be cached for 7 days for fast loading.</p>

      <div id="progress-container" class="hidden">
        <div class="progress-bar">
          <div id="progress-fill" class="progress-fill"></div>
        </div>
        <div id="progress-text" class="progress-text">Downloading... 0%</div>
      </div>

      <div class="modal-actions" id="modal-actions">
        <button id="modal-cancel" class="btn btn-secondary">Cancel</button>
        <button id="modal-accept" class="btn btn-primary">Download & Enable</button>
      </div>
    </div>
  </div>

  <!-- Scripts -->'''

new_content = content.replace('  <!-- Scripts -->', modal_html)

with open('index.html', 'w') as f:
    f.write(new_content)
