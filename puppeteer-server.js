const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 10000;

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }
  return browser;
}

app.get('/scrape', async (req, res) => {
  const { artist } = req.query;
  
  if (!artist) {
    return res.status(400).json({ error: 'Artist parameter required' });
  }

  const startTime = Date.now();
  
  try {
    const cleanName = artist.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const url = `https://www.1001tracklists.com/dj/${cleanName}/`;
    
    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    const artistId = await page.evaluate(() => {
      const link = document.querySelector('a[href*="songstats.com"]');
      if (link) {
        const match = link.href.match(/songstats\.com\/([a-z0-9]+)/i);
        return match ? match[1] : null;
      }
      return null;
    });
    
    await page.close();
    
    const artistSlug = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    return res.json({
      success: true,
      artist: artist,
      tracklists_id: artistId,
      songstats_url: artistId ? `https://songstats.com/artist/${artistId}/${artistSlug}` : null,
      processing_time: `${Date.now() - startTime}ms`
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      processing_time: `${Date.now() - startTime}ms`
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Puppeteer server running on port ${PORT}`);
});
