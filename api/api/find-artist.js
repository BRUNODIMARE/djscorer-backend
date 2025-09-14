export default async function handler(req, res) {
  // CORS headers
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
      return res.status(400).json({ 
        success: false,
        error: 'Instagram username required' 
      });
    }
    
    // Limpiar username
    const username = instagram
      .replace('@', '')
      .replace('https://www.instagram.com/', '')
      .replace('instagram.com/', '')
      .split('/')[0]
      .split('?')[0]
      .toLowerCase()
      .trim();
    
    console.log('Searching for:', username);
    
    // Llamar a Browserless con tu API key
    const browserlessResponse = await fetch('https://chrome.browserless.io/content?token=2T3HOcXs5RvAbb6c0099c9c03d87fe1c48b9e5fb8c4194241', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://songstats.com/search?q=${username}`,
        selector: 'a[href*="/artist/"]'
      })
    });
    
    const html = await browserlessResponse.text();
    console.log('HTML received, length:', html.length);
    
    // Buscar el link del artista
    const match = html.match(/href="(\/artist\/[^"]+)"/);
    
    if (match) {
      const fullUrl = `https://songstats.com${match[1]}`;
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
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Server error'
    });
  }
}
