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
    
    // MAPEO MANUAL TEMPORAL - Agrega más artistas aquí
    const artistMap = {
      'arodes': 'https://songstats.com/artist/utowk0hb/arodes',
      'mochakk': 'https://songstats.com/artist/c72f50i6/mochakk',
      'fred': 'https://songstats.com/artist/gz3xm1xn/fred-again',
      'fredagain': 'https://songstats.com/artist/gz3xm1xn/fred-again',
      'fisherprice': 'https://songstats.com/artist/xyz123/fisher',
      'disclosure': 'https://songstats.com/artist/abc456/disclosure'
    };
    
    if (artistMap[username]) {
      return res.status(200).json({ 
        success: true,
        songstatsUrl: artistMap[username]
      });
    }
    
    return res.status(404).json({ 
      success: false, 
      error: 'Artist not in database. Add manually or fix Browserless.' 
    });
    
  } catch (error) {
    console.error('Error in find-artist:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
}
