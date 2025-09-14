module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instagram } = req.body;
    
    if (!instagram) {
      return res.status(400).json({ error: 'Instagram username required' });
    }
    
    const username = instagram
      .replace('@', '')
      .replace('https://www.instagram.com/', '')
      .replace('https://instagram.com/', '')
      .split('/')[0]
      .split('?')[0]
      .toLowerCase()
      .trim();
    
    console.log('Searching for:', username);
    
    // ScrapingBee - con debug
    const searchUrl = `https://songstats.com/search?q=${username}`;
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=W77QRXZEQ4Q2L13Y7628L6U4L9DLALI9FLRFJH6AOQG57A0GKT0SDAKQV60YRRF5AJKGMZKZRSG1NKRD&url=${encodeURIComponent(searchUrl)}&render_js=true&wait=5000`;
    
    console.log('Calling ScrapingBee for:', searchUrl);
    
    const response = await fetch(scrapingBeeUrl);
    const html = await response.text();
    
    // Log para ver qué está devolviendo
    console.log('HTML length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));
    
    // Intentar múltiples patrones
    const patterns = [
      /href="(\/artist\/[^"]+)"/,
      /href='(\/artist\/[^']+)'/,
      /songstats\.com(\/artist\/[^"'\s]+)/,
      /<a[^>]+href=["'](\/artist\/[^"']+)["']/
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        console.log('Found with pattern:', pattern);
        return res.status(200).json({ 
          success: true,
          songstatsUrl: `https://songstats.com${match[1]}`
        });
      }
    }
    
    // Si no encuentra, devolver información de debug
    return res.status(404).json({ 
      success: false, 
      error: 'Artist not found',
      debug: {
        searchedFor: username,
        htmlReceived: html.length > 0,
        htmlLength: html.length,
        sample: html.substring(0, 200)
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
}
