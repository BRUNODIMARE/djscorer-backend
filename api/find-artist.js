export default async function handler(req, res) {
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
    
    console.log('Searching for artist:', username);
    
    // ScrapingBee API
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=W77QRXZEQ4Q2L13Y7628L6U4L9DLALI9FLRFJH6AOQG57A0GKT0SDAKQV60YRRF5AJKGMZKZRSG1NKRD&url=${encodeURIComponent(`https://songstats.com/search?q=${username}`)}&render_js=true&wait=3000`;
    
    const response = await fetch(scrapingBeeUrl);
    
    if (!response.ok) {
      throw new Error(`ScrapingBee API error: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Buscar el link del artista en el HTML
    const match = html.match(/href="(\/artist\/[^"]+)"/);
    
    if (match && match[1]) {
      console.log('Artist found:', match[1]);
      return res.status(200).json({ 
        success: true,
        songstatsUrl: `https://songstats.com${match[1]}`
      });
    }
    
    // Si no encuentra con el primer patrón, intenta otro
    const altMatch = html.match(/songstats\.com(\/artist\/[^"'\s]+)/);
    if (altMatch && altMatch[1]) {
      console.log('Artist found (alt):', altMatch[1]);
      return res.status(200).json({ 
        success: true,
        songstatsUrl: `https://songstats.com${altMatch[1]}`
      });
    }
    
    console.log('Artist not found for:', username);
    return res.status(404).json({ 
      success: false, 
      error: 'Artist not found on Songstats' 
    });
    
  } catch (error) {
    console.error('Error in find-artist:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
}
