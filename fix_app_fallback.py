import re

with open('js/app.js', 'r') as f:
    content = f.read()

fallback_ui = """
      // Update empty state text based on search term
      const h3 = emptyState.querySelector('h3');
      const fallbackBtn = emptyState.querySelector('.notify-maintainer-btn');

      if (currentSearchTerm) {
          h3.textContent = `No solutions found for "${currentSearchTerm}"`;

          if (!fallbackBtn && window.sendEmailFallback) {
              const btn = document.createElement('button');
              btn.className = 'notify-maintainer-btn';
              btn.textContent = 'Notify maintainer to add this scenario';
              btn.onclick = async () => {
                  btn.textContent = 'Sending...';
                  btn.disabled = true;
                  const success = await window.sendEmailFallback(currentSearchTerm);
                  if (success) {
                      btn.textContent = 'Maintainer notified!';
                      btn.style.backgroundColor = 'var(--color-success)';
                      btn.style.color = 'var(--color-primary)';
                  } else {
                      btn.textContent = 'Failed to send notify.';
                      btn.disabled = false;
                  }
              };
              emptyState.appendChild(btn);
          } else if (fallbackBtn) {
              fallbackBtn.style.display = 'inline-block';
              fallbackBtn.textContent = 'Notify maintainer to add this scenario';
              fallbackBtn.disabled = false;
              fallbackBtn.style.backgroundColor = '';
              fallbackBtn.style.color = '';
          }
      } else {
          h3.textContent = 'No solutions found';
          if (fallbackBtn) fallbackBtn.style.display = 'none';
      }
"""

content = re.sub(r'const h3 = emptyState\.querySelector\(\'h3\'\);.*?h3\.textContent = \'No solutions found\';\n      \}', fallback_ui, content, flags=re.DOTALL)

with open('js/app.js', 'w') as f:
    f.write(content)
