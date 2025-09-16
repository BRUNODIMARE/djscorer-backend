const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return data.access_token;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { instagram } = req.body;
  
  if (!instagram) {
    return res.status(400).json({ error: 'Instagram handle required' });
  }
  
  try {
    const token = await getSpotifyToken();
    const clean = instagram.replace('@', '').replace(/instagram\.com\//g, '').replace(/\//g, '').trim();
    
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(clean)}&type=artist&limit=5`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const searchData = await searchResponse.json();
    const artists = searchData.artists?.items || [];
    
    if (artists.length === 0) {
      return res.status(404).json({ error: 'No artists found' });
    }
    
    const artistList = artists.map((a, i) => 
      `${i}. ${a.name} - Followers: ${a.followers?.total || 0}`
    ).join('\n');
    
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Instagram: @${clean}\n\nSpotify:\n${artistList}\n\nWhich number matches best? Reply ONLY with the number.`
      }]
    });
    
    const bestIdx = parseInt(message.content[0].text.trim()) || 0;
    const artist = artists[bestIdx] || artists[0];
    
    // Usar nombre del artista como slug
    const artistSlug = artist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const songstatsUrl = `https://songstats.com/artist/${artistSlug}`;
    const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=XMX3B6Z-28W45J9-MJG5AEA-VEZRCQ3&url=${encodeURIComponent(songstatsUrl)}&width=1440&height=900&delay=3000`;
    
    return res.json({
      success: true,
      artist_name: artist.name,
      spotify_id: artist.id,
      songstats_url: songstatsUrl,
      screenshot_url: screenshotUrl,
      spotify_data: {
        followers: artist.followers?.total,
        popularity: artist.popularity,
        image: artist.images?.[0]?.url,
        genres: artist.genres
      }
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
