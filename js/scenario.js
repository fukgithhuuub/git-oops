// Watermarked by https://github.com/pavnxet/git-oops
/**
 * Logic for the individual scenario page
 */

document.addEventListener('DOMContentLoaded', async () => {
  const data = await window.dataService.loadData();

  if (!data || data.length === 0) return;

  const urlParams = new URLSearchParams(window.location.search);
  const scenarioId = urlParams.get('id');

  if (!scenarioId) {
    // Redirect home or show error
    window.location.href = 'index.html';
    return;
  }

  const scenario = data.find(s => s.id === scenarioId);

  if (!scenario) {
    // Show not found
    document.querySelector('.main-content').innerHTML = `
      <div class="container empty-state">
        <h2>Scenario not found</h2>
        <p>We couldn't find a solution for that problem.</p>
        <a href="index.html" class="btn">Back to Home</a>
      </div>
    `;
    return;
  }

  // Render the page
  renderScenario(scenario, data);
  setupCopyButtons();
  injectJsonLd(scenario);
});

function renderScenario(scenario, allData) {
  // Update document title and metadata
  document.title = `${scenario.title} · Git Oops`;
  document.querySelector('meta[name="description"]').setAttribute('content', scenario.description);

  // Update OG tags (assuming they exist in HTML, otherwise add them dynamically)
  updateMetaTag('og:title', `${scenario.title} · Git Oops`);
  updateMetaTag('og:description', scenario.description);

  // Set breadcrumb
  const breadcrumbCategory = document.getElementById('breadcrumb-category');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  if (breadcrumbCategory) breadcrumbCategory.textContent = capitalizeFirstLetter(scenario.category);
  if (breadcrumbTitle) breadcrumbTitle.textContent = scenario.title;

  // Breadcrumb link
  if(breadcrumbCategory) breadcrumbCategory.href = `index.html?category=${scenario.category}`;

  // Set Title and Description
  const scenarioTitle = document.getElementById('scenario-title');
  const scenarioDescription = document.getElementById('scenario-description');
  if (scenarioTitle) scenarioTitle.textContent = scenario.title;
  if (scenarioDescription) scenarioDescription.textContent = scenario.description;

  // Set Danger Badge
  const dangerBadge = document.getElementById('danger-badge');
  if (dangerBadge) {
    dangerBadge.className = `badge badge-danger-${scenario.danger}`;
    dangerBadge.textContent = getDangerLabel(scenario.danger);
  }

  // Render Steps/Decision Tree
  const stepsContainer = document.getElementById('steps-container');
  if (stepsContainer) {
    if (scenario.steps.length > 1 && scenario.steps[0].condition) {
      // We have multiple conditions, render tabs
      renderTabs(scenario.steps, stepsContainer);
    } else {
      // Single set of steps or steps without conditions
      scenario.steps.forEach((step, index) => {
         stepsContainer.innerHTML += renderStepContent(step, index, true);
      });
    }
  }

  // Render Related Scenarios
  const relatedContainer = document.getElementById('related-grid');
  if (relatedContainer && scenario.related && scenario.related.length > 0) {
    const relatedHtml = scenario.related.map(id => {
      const relScen = allData.find(s => s.id === id);
      if (!relScen) return '';
      return createRelatedCard(relScen);
    }).join('');

    relatedContainer.innerHTML = relatedHtml;
    document.getElementById('related-section').classList.remove('hidden');
  } else if (document.getElementById('related-section')) {
    document.getElementById('related-section').classList.add('hidden');
  }
}

function renderTabs(steps, container) {
  // Create Tabs Header
  let tabsHtml = `<div class="tabs-container">
    <div class="tabs" role="tablist">`;

  steps.forEach((step, index) => {
    const activeClass = index === 0 ? 'active' : '';
    tabsHtml += `
      <button class="tab-btn ${activeClass}" role="tab" aria-selected="${index === 0}" aria-controls="panel-${index}" id="tab-${index}">
        ${escapeHTML(step.condition || `Option ${index + 1}`)}
      </button>`;
  });

  tabsHtml += `</div></div>`;

  // Create Content Panels
  let panelsHtml = `<div class="tab-panels">`;
  steps.forEach((step, index) => {
    const activeClass = index === 0 ? 'active' : '';
    panelsHtml += renderStepContent(step, index, index === 0);
  });
  panelsHtml += `</div>`;

  container.innerHTML = tabsHtml + panelsHtml;

  // Add event listeners to tabs
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabPanels = container.querySelectorAll('.step-content');

  tabBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      // Deactivate all
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-hidden', 'true');
      });

      // Activate clicked
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetPanel = container.querySelector(`#panel-${index}`);
      if (targetPanel) {
         targetPanel.classList.add('active');
         targetPanel.setAttribute('aria-hidden', 'false');
      }
    });
  });
}


const commandExplanations = {
  'git reset': 'Undo commits or unstage files.',
  'git commit': 'Save your staged changes.',
  'git add': 'Stage files for the next commit.',
  'git branch': 'List, create, rename, or delete branches.',
  'git checkout': 'Switch to a branch, commit, or tag.',
  'git rm': 'Remove files from Git tracking.',
  'git filter-repo': 'Rewrite entire repository history (advanced).',
  'git push': 'Upload local commits to the remote repository.',
  'git reflog': 'View a log of all branch updates (your safety net).',
  'git stash': 'Temporarily hide uncommitted changes.',
  'git pull': 'Download changes from the remote and merge them.',
  'git remote': 'Manage remote repository connections.',
  'git merge': 'Combine changes from one branch into another.',
  'git rebase': 'Reapply commits on top of another base tip.',
  'git restore': 'Discard changes or unstage files.',
  'git bisect': 'Use binary search to find the commit that introduced a bug.',
  'git fsck': 'Verify the integrity of Git objects.',
  'git show': 'View the changes introduced by a specific commit.',
  'git cherry-pick': 'Copy a specific commit from another branch.',
  'git clean': 'Remove untracked files from the working directory.',
  'git fetch': 'Download changes from the remote without merging.',
  'git tag': 'Create, list, or delete tags.',
  'git gc': 'Clean up unnecessary files and optimize the repository.',
  'git lfs': 'Manage large files using Git Large File Storage.',
  'git config': 'Get or set Git configuration options.',
  'git blame': 'Show what revision and author last modified each line of a file.',
  'git worktree': 'Manage multiple working trees attached to the same repository.',
  'git status': 'Show the working tree status.',
  'git revert': 'Create a new commit that undoes the changes of a previous commit.'
};

function getCommandBreakdown(commandsText) {
  const foundCommands = new Set();
  const sortedKeys = Object.keys(commandExplanations).sort((a,b) => b.length - a.length);
  commandsText.split('\n').forEach(line => {
    // Strip comments
    if (line.trim().startsWith('#')) return;

    for (const cmd of sortedKeys) {
      if (line.includes(cmd)) {
        foundCommands.add(cmd);
        break; // Stop after finding the first matching base command in a line
      }
    }
  });

  if (foundCommands.size === 0) return '';

  let breakdownHtml = `<div class="command-breakdown" style="margin-top: 1rem; padding: 1rem; background-color: var(--color-bg); border-radius: var(--border-radius-card); border: 1px solid var(--color-border);">
    <h4 style="margin-bottom: 0.5rem; color: var(--color-primary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Commands used:</h4>
    <ul style="list-style-type: none; padding: 0;">`;

  foundCommands.forEach(cmd => {
    breakdownHtml += `<li style="margin-bottom: 0.5rem; font-size: 0.875rem; display: flex; align-items: baseline; gap: 0.5rem;">
      <code style="background-color: var(--color-card-bg); padding: 0.125rem 0.375rem; border-radius: 4px; border: 1px solid var(--color-border); font-family: var(--font-code); color: var(--color-primary); font-size: 0.8em; white-space: nowrap;">${cmd}</code>
      <span style="color: var(--color-text-muted); line-height: 1.4;">${commandExplanations[cmd]}</span>
    </li>`;
  });

  breakdownHtml += `</ul></div>`;
  return breakdownHtml;
}

function renderStepContent(step, index, isActive) {
  const activeClass = isActive ? 'active' : '';
  const commandsText = step.commands.join('\n');

  let html = `
    <div class="step-content ${activeClass}" id="panel-${index}" role="tabpanel" aria-labelledby="tab-${index}" aria-hidden="${!isActive}">
  `;

  if (step.warning) {
    html += `
      <div class="warning-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="warning-icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        <div>
          <strong>Warning:</strong> ${escapeHTML(step.warning)}
        </div>
      </div>
    `;
  }

  html += `
      <div class="code-container">
        <div class="code-block"><code>${escapeHTML(commandsText)}</code></div>
        <button class="copy-btn" data-clipboard-text="${escapeHTML(commandsText)}" aria-label="Copy code">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy
        </button>
      </div>
      <div class="explanation">
        <p>${escapeHTML(step.explanation)}</p>
        ${getCommandBreakdown(commandsText)}
      </div>
    </div>
  `;

  return html;
}

function createRelatedCard(scenario) {
  const dangerClass = `badge-danger-${scenario.danger}`;
  const dangerLabel = getDangerLabel(scenario.danger);

  return `
    <a href="scenario.html?id=${scenario.id}" class="scenario-card">
      <div class="card-header">
        <h4 class="card-title" style="font-size: 1.1rem;">${escapeHTML(scenario.title)}</h4>
        <div class="card-badges">
          <span class="badge ${dangerClass}">${dangerLabel}</span>
        </div>
      </div>
    </a>
  `;
}

function setupCopyButtons() {
  const stepsContainer = document.getElementById('steps-container');
  if(!stepsContainer) return;

  stepsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;

    const textToCopy = btn.getAttribute('data-clipboard-text');

    // Decode escaped HTML
    const textarea = document.createElement('textarea');
    textarea.innerHTML = textToCopy;
    const decodedText = textarea.value;

    copyToClipboard(decodedText)
      .then(() => {
        // Change icon to checkmark
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Copied!
        `;
        btn.classList.add('copied');

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove('copied');
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback or error message could go here
      });
  });
}

// Fallback copy function
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // text area fallback
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Move textarea out of screen to avoid scrolling or visible elements
    textArea.style.position = "absolute";
    textArea.style.left = "-999999px";

    document.body.prepend(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      textArea.remove();
      return Promise.resolve();
    } catch (error) {
      textArea.remove();
      return Promise.reject(error);
    }
  }
}

function updateMetaTag(property, content) {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getDangerLabel(danger) {
  switch(danger) {
    case 'safe': return '🟢 Safe';
    case 'caution': return '🟡 Caution';
    case 'destructive': return '🔴 Destructive';
    default: return danger;
  }
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function injectJsonLd(scenario) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": scenario.title,
    "description": scenario.description,
    "step": scenario.steps.map((step, index) => ({
      "@type": "HowToStep",
      "name": step.condition || `Step ${index + 1}`,
      "text": step.explanation,
      "itemListElement": [{
        "@type": "HowToDirection",
        "text": step.commands.join('\n')
      }]
    }))
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}
