from playwright.sync_api import Page, expect, sync_playwright

def verify_restart_button(page: Page):
    # 1. Arrange: Go to the app.
    page.goto("http://localhost:5173")

    # 2. Act: Click on a song to enter the game.
    # We look for the song title.
    page.get_by_text("Al Yazmalım").click()

    # 3. Assert: Verify we are in the game and see the Restart button.
    # The game starts in IDLE mode.
    restart_button = page.get_by_role("button", name="Restart")
    expect(restart_button).to_be_visible()

    # 4. Screenshot: Capture the Game IDLE screen with the Restart button.
    page.screenshot(path="verification/game_idle_with_restart.png")
    print("Screenshot saved to verification/game_idle_with_restart.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_restart_button(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
