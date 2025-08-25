const puppeteer = require('puppeteer');
require('dotenv').config();

const email = process.env.FB_EMAIL || 'eliakimrotich@gmail.com';
const password = process.env.FB_PASSWORD || '8525itwt';
const COMMENT_TEXTS = [
  "Nice post!",
  "Great!",
  "Thanks for sharing!",
  "Interesting!"
];
const NUM_LIKES = 100;     // Change this for number of posts to like
const NUM_COMMENTS = 100;  // Change this for number of posts to comment

function getRandomComment() {
  return COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
    await page.type('#email', email);
    await page.type('#pass', password);
    await Promise.all([
      page.click('button[name="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
    ]);
    console.log('Logged in.');

    // Wait for feed
    await page.waitForSelector('[role="feed"]', { timeout: 20000 });

    // Scroll to load posts
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(2000);
    }

    // Like unliked posts
    let liked = 0;
    const likeSelectors = [
      'div[aria-label="Like"][role="button"]',
      'span[aria-label="Like"]',
      'button[aria-label="Like"]'
    ];
    let likeButtons = [];
    for (const sel of likeSelectors) {
      likeButtons = await page.$$(sel);
      if (likeButtons.length > 0) break;
    }
    console.log(`Found ${likeButtons.length} Like buttons`);

    for (let i = 0; i < likeButtons.length && liked < NUM_LIKES; i++) {
      try {
        // Check if not already liked
        const label = await likeButtons[i].evaluate(el => el.getAttribute('aria-label'));
        if (label === "Like") {
          await likeButtons[i].click();
          liked++;
          console.log(`Liked post ${liked}`);
          await page.waitForTimeout(1200);
        }
      } catch (err) {
        console.error(`Error liking post ${i + 1}:`, err.message);
      }
    }

    // Comment on posts
    let commented = 0;
    const commentSelectors = [
      'div[aria-label="Write a comment"]',
      'input[aria-label="Write a comment"]'
    ];
    let commentAreas = [];
    for (const sel of commentSelectors) {
      commentAreas = await page.$$(sel);
      if (commentAreas.length > 0) break;
    }
    console.log(`Found ${commentAreas.length} comment areas`);

    for (let i = 0; i < commentAreas.length && commented < NUM_COMMENTS; i++) {
      try {
        await commentAreas[i].click();
        await page.waitForTimeout(500);
        await page.keyboard.type(getRandomComment());
        await page.keyboard.press('Enter');
        commented++;
        console.log(`Commented on post ${commented}`);
        await page.waitForTimeout(1500);
      } catch (err) {
        console.error(`Error commenting on post ${i + 1}:`, err.message);
      }
    }

    console.log('Automation finished.');
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await browser.close();
  }
})();
