from playwright.sync_api import sync_playwright

def test_search():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/index.html")

        # Wait for app load
        page.wait_for_selector(".scenario-card", state="visible")

        # Test enabling AI search
        page.click("#ai-search-toggle")
        page.wait_for_selector("#ai-popup-overlay:not(.hidden)", state="visible")
        page.click("#ai-btn-yes")

        # Wait for the AI model to load (button gets active class)
        page.wait_for_selector("#ai-search-toggle.ai-active", timeout=30000)

        # Test Semantic Search (should use the new embeddings)
        page.fill("#search-input", "I want to delete all files of main branch")

        # We need to wait for debounce (200ms + search time)
        page.wait_for_timeout(1000)

        # Ensure the card displays the semantic match
        page.wait_for_selector("#scenario-delete-all-files-branch")

        # Test Empty state Fallback
        page.fill("#search-input", "sdgkjhfkjhkjsdhfsdkhf")
        page.wait_for_timeout(1000)

        # Wait for notify button
        page.wait_for_selector(".notify-maintainer-btn", state="visible")

        print("Integration test passed! AI Search operates correctly.")
        browser.close()

if __name__ == "__main__":
    test_search()
