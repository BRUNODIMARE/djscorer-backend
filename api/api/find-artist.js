export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { instagram } = req.body;
  
  if (!instagram) {
    return res.status(400).json({ error: 'Instagram username required' });
  }
  
  // Limpiar username
  const username = instagram.replace('@', '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  
  try {
    // Llamar a Browserless
    const browserlessUrl = 'https://chrome.browserless.io/content?token=2T3HOcXs5RvAbb6c0099c9c03d87fe1c48b9e5fb8c4194241';
    
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://songstats.com/search?q=${username}`,
        waitForSelector: 'a[href*="/artist/"]',
        waitForTimeout: 3000,
        elements: [{
          selector: 'a[href*="/artist/"]:first-of-type',
          attribute: 'href'
        }]
      })
    });
    
    const data = await response.json();
    console.log('Browserless response:', JSON.stringify(data));
    
    if (data && data.data && data.data.length > 0) {
      const href = data.data[0].href || data.data[0].attributes?.href;
      const fullUrl = href.startsWith('http') ? href : `https://songstats.com${href}`;
      
      return res.status(200).json({ 
        success: true,
        songstatsUrl: fullUrl,
        username: username
      });
    }
    
    return res.status(404).json({ 
      success: false,
      error: 'Artist not found on Songstats',
      username: username
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
}
