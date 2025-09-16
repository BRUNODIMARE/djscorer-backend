const cache = {};

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
  
  const cleanName = artist.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  
  if (cache[cleanName]) {
    return res.json({ ...cache[cleanName], cached: true });
  }
  
  try {
    const tracklistsUrl = `https://www.1001tracklists.com/dj/${cleanName}/index.html`;
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(tracklistsUrl)}&premium_proxy=true&render_js=false`;
    
    const response = await fetch(scrapingBeeUrl);
    const html = await response.text();
    
    // Buscar todos los posibles patrones
    const patterns = [
      /\/artist\/([a-z0-9]+)\//gi,
      /artist_id["\s:=]+["']?([a-z0-9]+)/gi,
      /data-artist["\s:=]+["']?([a-z0-9]+)/gi
    ];
    
    let artistId = null;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        artistId = match[1];
        break;
      }
    }
    
    const artistSlug = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const songstatsUrl = artistId ? `https://songstats.com/artist/${artistId}/${artistSlug}` : null;
    
    const result = {
      success: true,
      artist: artist,
      tracklists_id: artistId,
      songstats_url: songstatsUrl,
      cached: false,
      html_length: html.length,
      html_sample: html.substring(0, 1000) // Ver primeros 1000 caracteres
    };
    
    cache[cleanName] = result;
    return res.json(result);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
