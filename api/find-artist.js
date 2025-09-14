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
    
    // Mapeo manual expandido - agrega más artistas aquí
    const artistMap = {
      'arodes': 'https://songstats.com/artist/utowk0hb/arodes',
      'arodes_ofc': 'https://songstats.com/artist/utowk0hb/arodes',
      'mochakk': 'https://songstats.com/artist/c72f50i6/mochakk',
      'fredagain': 'https://songstats.com/artist/gz3xm1xn/fred-again',
      'fred': 'https://songstats.com/artist/gz3xm1xn/fred-again',
      'disclosure': 'https://songstats.com/artist/0g3b3e5v/disclosure',
      'fisher': 'https://songstats.com/artist/3nz0e5i7/fisher',
      'carlcox': 'https://songstats.com/artist/8hz9m2k4/carl-cox',
      'blackcoffee': 'https://songstats.com/artist/7jx3n9p2/black-coffee',
      'amelielens': 'https://songstats.com/artist/4kl8m2n6/amelie-lens'
    };
    
    if (artistMap[username]) {
      return res.status(200).json({ 
        success: true,
        songstatsUrl: artistMap[username]
      });
    }
    
    // Para artistas no mapeados, devolver instrucciones claras
    return res.status(404).json({ 
      success: false, 
      error: `Artist "${username}" not in database. Please go to songstats.com, search for the artist, copy their URL and paste it in the field above.`
    });
    
  } catch (error) {
    console.error('Error in find-artist:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
}
