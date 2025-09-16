module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { artist } = req.query;
  
  if (!artist) {
    return res.status(400).json({ error: 'Artist name required' });
  }
  
  try {
    const cleanName = artist
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    const tracklistsUrl = `https://www.1001tracklists.com/dj/${cleanName}/index.html`;
    
    // Usar ScrapingBee
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(tracklistsUrl)}&render_js=false`;
    
    const response = await fetch(scrapingBeeUrl);
    const data = await response.json();
    
    // La URL final después de redirección
    const finalUrl = data.resolved_url || tracklistsUrl;
    const match = finalUrl.match(/\/artist\/([^\/]+)\//);
    const artistId = match ? match[1] : null;
    
    // Construir URL de Songstats
    const artistSlug = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const songstatsUrl = artistId 
      ? `https://songstats.com/artist/${artistId}/${artistSlug}`
      : null;
    
    return res.json({
      success: true,
      artist: artist,
      tracklists_id: artistId,
      tracklists_url: finalUrl,
      songstats_url: songstatsUrl
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
