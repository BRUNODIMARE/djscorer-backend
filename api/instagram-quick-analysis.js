module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { instagram } = req.body;
  
  try {
    // 1. Limpiar input
    const cleanArtist = instagram
      .replace('@', '')
      .replace(/https?:\/\/(www\.)?instagram\.com\//g, '')
      .trim();
    
    // 2. Buscar en Spotify
    const authString = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');
    
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Failed to get Spotify token' });
    }
    
    // Buscar con más resultados para mejor match
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanArtist)}&type=artist&limit=10`,
      { headers: { 'Authorization': `Bearer ${tokenData.access_token}` }}
    );
    
    const searchData = await searchRes.json();
    
    // Buscar match exacto o el más relevante
    let spotifyArtist = null;
    
    if (searchData.artists?.items?.length > 0) {
      // Intentar match exacto primero
      spotifyArtist = searchData.artists.items.find(artist => 
        artist.name.toLowerCase().replace(/\s+/g, '') === cleanArtist.toLowerCase().replace(/\s+/g, '')
      );
      
      // Si no hay match exacto, tomar el más popular
      if (!spotifyArtist) {
        spotifyArtist = searchData.artists.items.reduce((prev, current) => 
          (current.popularity > prev.popularity) ? current : prev
        );
      }
    }
    
    if (!spotifyArtist) {
      return res.status(404).json({ 
        error: 'Artist not found on Spotify',
        suggestion: 'Try using the Songstats URL directly'
      });
    }
    
    // 3. Construir URL de Songstats con Spotify ID
    const songstatsUrl = `https://songstats.com/artist/${spotifyArtist.id}`;
    
    // 4. Capturar screenshot
    const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=XMX3B6Z-28W45J9-MJG5AEA-VEZRCQ3&url=${encodeURIComponent(songstatsUrl)}&width=1440&height=900&output=json&file_type=png&wait_for_event=load&delay=3000`;
    
    const screenshotRes = await fetch(screenshotUrl);
    const screenshotData = await screenshotRes.json();
    
    if (!screenshotData.screenshot) {
      return res.status(500).json({ error: 'Failed to capture screenshot' });
    }
    
    // 5. Retornar URL del screenshot para análisis
    return res.json({
      success: true,
      artist_name: spotifyArtist.name,
      spotify_id: spotifyArtist.id,
      songstats_url: songstatsUrl,
      screenshot_url: screenshotData.screenshot,
      spotify_data: {
        followers: spotifyArtist.followers?.total || 0,
        popularity: spotifyArtist.popularity || 0,
        image: spotifyArtist.images?.[0]?.url
      }
    });
    
  } catch (error) {
    console.error('Instagram analysis error:', error);
    return res.status(500).json({ error: error.message });
  }
};
