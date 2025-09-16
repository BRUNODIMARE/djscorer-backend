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
    
    // ScrapingBee - seguir redirecciones
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(tracklistsUrl)}&return_page_source=false`;
    
    const response = await fetch(scrapingBeeUrl);
    
    // ScrapingBee pone la URL final en headers
    const finalUrl = response.headers.get('spb-resolved-url') || response.headers.get('x-final-url') || tracklistsUrl;
    
    const match = finalUrl.match(/\/artist\/([^\/]+)\//);
    const artistId = match ? match[1] : null;
    
    const artistSlug = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const songstatsUrl = artistId 
      ? `https://songstats.com/artist/${artistId}/${artistSlug}`
      : null;
    
    return res.json({
      success: true,
      artist: artist,
      tracklists_id: artistId,
      tracklists_url: finalUrl,
      songstats_url: songstatsUrl,
      debug: {
        response_status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      }
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
