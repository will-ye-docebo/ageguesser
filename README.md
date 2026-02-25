# Signal Drift (Age Preference Game)

A browser-based game where players pick between two subtly different images across **7 rounds**.
After the final round, the game estimates a **5-year age band**.

## Run

Open either page in any modern browser:

- `index.html` for the image-based game.
- `words.html` for the 7-round word-based game that estimates age in-browser.

## How It Works

- Each round shows two procedurally generated pictures with subtle style differences.
- Differences are intentionally mixed (warmth, texture, contrast, spacing, motion) so there is no obvious "young vs old" choice.
- Left/right mapping is randomized every round.
- A Bayesian-style posterior updates across age bins (5-year ranges) after each pick.
- Posterior smoothing and tempered evidence reduce extreme swings between repeated plays.
- Final output is the most likely 5-year age region plus a confidence score.

## Notes

- This is an entertainment/prototype inference model, not a clinical or scientific age test.
- Press `A`/left arrow for left image and `L`/right arrow for right image.
- In the word game, use the same `A`/left and `L`/right controls.
- The word game runs entirely in-browser and does not call external APIs.
- API key placeholder file: `.env.local` (`OPENAI_API_KEY=`).
