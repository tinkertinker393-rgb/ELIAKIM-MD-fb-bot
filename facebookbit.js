const puppeteer = require('puppeteer');

const email = 'eliakimrotich@gmail.com';
const password = '8525itwt';
const awayMessage = "Hello, I'm ELIAKIM's bot and he's not available now. He'll be here soon.";

async function reactToPosts(page, type = 'LIKE', count = 3) {
  // Types: LIKE, LOVE, HAHA, WOW, SAD, ANGRY
  for (let i = 0; i < count; i++) {
    try {
      // Find post
      const post = (await page.$$('div[role="article"]'))[i];
      if (!post) continue;

      // Hover on Like to show reactions
      const likeBtn = await post.$('div[aria-label="Like"]');
      if (!likeBtn) continue;
      await likeBtn.hover();
      await page.waitForTimeout(800);

      // Click the react button
      let reactBtn;
      switch (type) {
        case 'LOVE':
          reactBtn = await page.$('div[aria-label="Love"]');
          break;
        case 'HAHA':
          reactBtn = await page.$('div[aria-label="Haha"]');
          break;
        case 'WOW':
          reactBtn = await page.$('div[aria-label="Wow"]');
          break;
        case 'SAD':
          reactBtn = await page.$('div[aria-label="Sad"]');
          break;
        case 'ANGRY':
          reactBtn = await page.$('div[aria-label="Angry"]');
          break;
        default:
          reactBtn = likeBtn;
      }
      if (reactBtn) {
        await reactBtn.click();
        console.log(`Reacted with ${type} on post ${i + 1}`);
      }
      await page.waitForTimeout(1500);
    } catch (err) {
      console.error(`Error reacting to post ${i + 1}:`, err.message);
    }
  }
}

async function autoReplyMessages(page, awayMessage) {
  try {
    await page.goto('https://www.facebook.com/messages', { waitUntil: 'networkidle2' });
    await page.waitForSelector('ul[role="listbox"]', { timeout: 15000 });

    const chats = await page.$$('ul[role="listbox"] li');
    for (let i = 0; i < Math.min(2, chats.length); i++) {
      try {
        await chats[i].click();
        await page.waitForSelector('div[aria-label="Type a message..."]', { timeout: 7000 });
        await page.type('div[aria-label="Type a message..."]', awayMessage);
        await page.keyboard.press('Enter');
        console.log(`Sent away message to chat ${i + 1}`);
        await page.waitForTimeout(2000);
      } catch (err) {
        console.error(`Error replying to chat ${i + 1}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error in auto-reply messages:', err.message);
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });

    // Log in
    await page.type('#email', email);
    await page.type('#pass', password);
    await Promise.all([
      page.click('button[name="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
    ]);
    console.log('Logged in.');

    // Out React (LOVE react to first 3 posts)
    await page.waitForSelector('[role="feed"]', { timeout: 20000 });
    await reactToPosts(page, 'LOVE', 3);

    // Away Message (auto-reply to first 2 chats)
    await autoReplyMessages(page, awayMessage);

    console.log('Automation finished.');
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await browser.close();
  }
})();
