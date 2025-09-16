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
    
    // Múltiples patrones para buscar el ID
    let artistId = null;
    
    // Patrón 1: songstats.com/ID?
    const match1 = html.match(/songstats\.com\/([a-z0-9]+)\?/i);
    if (match1) artistId = match1[1];
    
    // Patrón 2: songstats.com/ID" o songstats.com/ID'
    if (!artistId) {
      const match2 = html.match(/songstats\.com\/([a-z0-9]+)[\"\']/i);
      if (match2) artistId = match2[1];
    }
    
    // Patrón 3: /artist/ID/ en cualquier lugar
    if (!artistId) {
      const match3 = html.match(/\/artist\/([a-z0-9]+)\//i);
      if (match3) artistId = match3[1];
    }
    
    const artistSlug = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const songstatsUrl = artistId 
      ? `https://songstats.com/artist/${artistId}/${artistSlug}`
      : null;
    
    const result = {
      success: true,
      artist: artist,
      tracklists_id: artistId,
      songstats_url: songstatsUrl,
      cached: false,
      html_sample: html.substring(html.indexOf('songstats') - 50, html.indexOf('songstats') + 100) // Debug
    };
    
    cache[cleanName] = result;
    return res.json(result);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
