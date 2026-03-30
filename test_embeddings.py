from playwright.sync_api import sync_playwright

def test_chat():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Setup console log listener to confirm embeddings loaded
        logs = []
        page.on("console", lambda msg: logs.append(msg.text))

        # Navigate
        page.goto("http://localhost:8000/index.html")
        page.wait_for_selector("#ai-chat-btn", state="visible")

        # Open chat & agree to consent
        page.click("#ai-chat-btn")
        page.wait_for_selector("#ai-btn-yes", state="visible")
        page.click("#ai-btn-yes")

        # Wait for model download and chatbox to appear
        page.wait_for_selector("#ai-chatbox:not(.hidden)", timeout=30000)

        # Verify "Loaded pre-computed embeddings" log message exists
        assert any("Loaded pre-computed embeddings" in log for log in logs), "Embeddings not loaded!"

        # Type test message
        page.fill("#ai-chat-input", "I want to delete all files of main branch")
        page.click(".ai-send-btn")

        # Wait for reply "Found it!"
        page.wait_for_selector(".ai-message-bot:has-text('Found it!')", timeout=15000)

        # Verify related card was highlighted (target id should be scenario-delete-all-files-branch)
        page.wait_for_selector(".ai-highlight")

        print("Integration test passed! Pre-computed embeddings loaded and threshold works.")
        browser.close()

if __name__ == "__main__":
    test_chat()
