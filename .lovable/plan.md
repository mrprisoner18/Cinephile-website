

## Plan: Update Collection Lists & Fix Features

### What changes

**1. Replace Movies list with exact user-provided data (119 movies, grouped by category)**

The current movies page has ~73 items across MCU, Venom, Anaconda, Bruce Lee, and Jackie Chan sections. The user provided a complete list of 119 movies organized into these sections:
- MCU Movies (1-33)
- Deadpool & Wolverine Movies (34-42)
- Venom Series (43-45)
- DC Movies > Batman Series (46-48)
- DC Movies > Joker Series (49-50)
- Conjuring Universe (51-60)
- Final Destination Series (61-66)
- Anaconda Series (67-73)
- Bruce Lee Movies (74-77)
- Jackie Chan Movies 2000-2025 (78-119)

**2. Update Web Series list to match screenshot**

Replace current list with exactly: Stranger Things, Loki, Money Heist, Wednesday, Squid Game, Harry Potter (Series), Game of Thrones (7 items as shown in screenshot).

**3. Update Anime Series list to match screenshot**

Replace with exactly: Demon Slayer, Death Note, Solo Leveling, Jujutsu Kaisen, Chainsaw Man, The Fragrant Flower Blooms with Dignity, The Angel Next Door Spoils Me Rotten (7 items).

**4. Update Anime Movies list to match screenshot**

Replace with exactly: Weathering With You, Your Name, A Silent Voice, I Want To Eat Your Pancreas, The Garden of the Words, The Tunnel to Summer the Exit of Goodbyes, Suzume (7 items).

**5. Navigation fix**

The current `popstate` handler looks correct but may have edge cases. Will add a guard state at the bottom of history to prevent the browser from exiting the app entirely when pressing back on the home page.

### Technical approach

- Edit `public/app.html` only
- Replace the movies page content (lines ~232-342) with the full 119-item list organized into the user's category sections with proper `parent-label` and `section-head` dividers
- Replace web series items (lines ~367-373) with 7 items including Game of Thrones
- Replace anime series items (lines ~424-431) with the 7 items from the screenshot
- Replace anime movies items (lines ~459-463) with 7 items from the screenshot
- Strengthen navigation: add an initial guard `pushState` so pressing back on home doesn't exit the page

### Files modified
- `public/app.html` — all changes in this single file

