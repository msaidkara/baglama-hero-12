
from playwright.sync_api import sync_playwright
import time

def verify_game_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Wait for the app to load
        time.sleep(5)

        # Take a screenshot of the main menu
        print("Taking screenshot of main menu...")
        page.screenshot(path="verification/main_menu.png")

        # Try to find a song or start button to enter game
        # Assuming there is a song selection or play button
        # Based on previous exploration, there might be a song list.
        # Let's try to click a 'Play' button if it exists or click on a song item.

        # Just capturing the main load state first to verify basic functionality
        # and checking if the SF2 service initialized (logs would be in browser console, but we can't easily see them here unless we listen to events)

        browser.close()

if __name__ == "__main__":
    verify_game_load()
