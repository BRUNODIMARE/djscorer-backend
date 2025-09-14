export default async function handler(req, res) {
  // CORS headers PRIMERO
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo aceptar POST
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
    
    // Por ahora, usar mapeo manual (Browserless después)
    const knownArtists = {
      'realblackcoffee': 'https://songstats.com/artist/tf4aezjl/black-coffee',
      'blackcoffee': 'https://songstats.com/artist/tf4aezjl/black-coffee',
      'arodes': 'https://songstats.com/artist/utowk0hb/arodes',
      'mochakk': 'https://songstats.com/artist/c72f50i6/mochakk'
    };
    
    if (knownArtists[username]) {
      return res.status(200).json({ 
        success: true,
        songstatsUrl: knownArtists[username],
        username: username
      });
    }
    
    // Si no está en la base de datos
    return res.status(404).json({ 
      success: false,
      error: 'Artist not found in database',
      username: username
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Server error'
    });
  }
}
