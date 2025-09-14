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
    
    console.log('Searching for artist:', username);
    
    // Mapeo manual para artistas conocidos
    const artistMap = {
      'arodes': 'https://songstats.com/artist/utowk0hb/arodes',
      'arodes_ofc': 'https://songstats.com/artist/utowk0hb/arodes',
      'mochakk': 'https://songstats.com/artist/c72f50i6/mochakk'
    };
    
    if (artistMap[username]) {
      return res.status(200).json({ 
        success: true,
        songstatsUrl: artistMap[username]
      });
    }
    
    // Usar ScrapingBee con diferentes selectores
    try {
      const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=W77QRXZEQ4Q2L13Y7628L6U4L9DLALI9FLRFJH6AOQG57A0GKT0SDAKQV60YRRF5AJKGMZKZRSG1NKRD&url=${encodeURIComponent(`https://songstats.com/search?q=${username}`)}&render_js=true&wait=5000&extract_rules=${encodeURIComponent(JSON.stringify({
        artist_link: {
          selector: 'a[href*="/artist/"]',
          type: 'link'
        }
      }))}`;
      
      const response = await fetch(scrapingBeeUrl);
      const data = await response.json();
      
      console.log('ScrapingBee response:', data);
      
      if (data.artist_link) {
        const artistPath = data.artist_link.match(/\/artist\/[^\/]+\/[^\/]+/);
        if (artistPath) {
          return res.status(200).json({ 
            success: true,
            songstatsUrl: `https://songstats.com${artistPath[0]}`
          });
        }
      }
    } catch (scrapingError) {
      console.error('ScrapingBee failed:', scrapingError);
    }
    
    return res.status(404).json({ 
      success: false, 
      error: 'Artist not found. Please use the Songstats URL directly.' 
    });
    
  } catch (error) {
    console.error('Error in find-artist:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
}
