module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist } = req.body;
  
  if (!artist) {
    return res.status(400).json({ error: 'Artist name required' });
  }

  try {
    // Get Spotify token
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
    
    // Search artist
    const cleanArtist = artist.replace('@', '').replace('instagram.com/', '').trim();
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanArtist)}&type=artist&limit=1`,
      { headers: { 'Authorization': `Bearer ${tokenData.access_token}` }}
    );
    
    const searchData = await searchRes.json();
    
    if (searchData.artists?.items?.[0]) {
      const spotifyArtist = searchData.artists.items[0];
      
      return res.json({
        success: true,
        spotifyId: spotifyArtist.id,
        name: spotifyArtist.name,
        followers: spotifyArtist.followers?.total || 0,
        popularity: spotifyArtist.popularity || 0,
        image: spotifyArtist.images?.[0]?.url || null
      });
    }
    
    return res.status(404).json({ 
      success: false, 
      error: 'Artist not found on Spotify' 
    });
    
  } catch (error) {
    console.error('Spotify search error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
