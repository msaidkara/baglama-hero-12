
from playwright.sync_api import sync_playwright
import time

def verify_game_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Wait for load
        time.sleep(3)

        # Click on the first song to enter the game
        # Using a selector that likely matches the song item from the previous screenshot
        print("Entering game...")
        # Looking for text that matches one of the songs "Selvi Boylum"
        page.get_by_text("Selvi Boylum").click()

        # Wait for game to load
        time.sleep(2)

        # Click "Start Listening" or "Start Game" to begin
        print("Starting game...")
        start_button = page.get_by_text("Start Listening")
        if start_button.is_visible():
            start_button.click()
        else:
             page.get_by_text("Start Game").click()

        # Let it run for a few seconds
        time.sleep(3)

        # Take screenshot of running game
        print("Taking screenshot of running game...")
        page.screenshot(path="verification/game_running.png")

        # Find Restart button
        print("Clicking Restart...")
        # In the new code, the restart button during play is an IconButton with specific style or text "Restart"
        restart_button = page.get_by_role("button", name="Restart")
        restart_button.click()

        # Wait a bit
        time.sleep(2)

        # Take screenshot of restarted game
        print("Taking screenshot of restarted game...")
        page.screenshot(path="verification/game_restarted.png")

        browser.close()

if __name__ == "__main__":
    verify_game_flow()
