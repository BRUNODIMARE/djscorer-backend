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
    
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanArtist)}&type=artist&limit=5`,
      { headers: { 'Authorization': `Bearer ${tokenData.access_token}` }}
    );
    
    const searchData = await searchRes.json();
    
    if (!searchData.artists?.items?.length) {
      return res.status(404).json({ error: 'No artists found' });
    }
    
    // 3. Si solo hay un resultado, usarlo directamente
    if (searchData.artists.items.length === 1) {
      const artist = searchData.artists.items[0];
      return await generateResponse(artist);
    }
    
    // 4. Si hay múltiples, usar Claude para elegir el correcto
    const candidates = searchData.artists.items.map((artist, idx) => 
      `${idx + 1}. ${artist.name} - Genres: ${(artist.genres || ['none']).join(', ')} - Popularity: ${artist.popularity} - Followers: ${artist.followers.total.toLocaleString()}`
    ).join('\n');
    
    const claudePrompt = `Instagram handle: @${cleanArtist}

Spotify search results:
${candidates}

Which artist number (1-${searchData.artists.items.length}) best matches the Instagram handle @${cleanArtist}? Consider name similarity, genre relevance for DJs/electronic music, and popularity. Respond with ONLY the number.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: claudePrompt
        }]
      })
    });
    
    const claudeData = await claudeRes.json();
    const selectedIndex = parseInt(claudeData.content[0].text.trim()) - 1;
    
    if (selectedIndex >= 0 && selectedIndex < searchData.artists.items.length) {
      const selectedArtist = searchData.artists.items[selectedIndex];
      return await generateResponse(selectedArtist);
    } else {
      // Fallback al más popular
      const artist = searchData.artists.items[0];
      return await generateResponse(artist);
    }
    
    async function generateResponse(artist) {
      const songstatsUrl = `https://songstats.com/artist/${artist.id}`;
      
      const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=XMX3B6Z-28W45J9-MJG5AEA-VEZRCQ3&url=${encodeURIComponent(songstatsUrl)}&width=1440&height=900&output=json&file_type=png&wait_for_event=load&delay=3000`;
      
      const screenshotRes = await fetch(screenshotUrl);
      const screenshotData = await screenshotRes.json();
      
      if (!screenshotData.screenshot) {
        return res.status(500).json({ error: 'Failed to capture screenshot' });
      }
      
      return res.json({
        success: true,
        artist_name: artist.name,
        spotify_id: artist.id,
        songstats_url: songstatsUrl,
        screenshot_url: screenshotData.screenshot,
        spotify_data: {
          followers: artist.followers?.total || 0,
          popularity: artist.popularity || 0,
          image: artist.images?.[0]?.url,
          genres: artist.genres || []
        }
      });
    }
    
  } catch (error) {
    console.error('Smart analysis error:', error);
    return res.status(500).json({ error: error.message });
  }
};
