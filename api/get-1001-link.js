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
    
    // Buscar el canonical link o alternate URLs
    let artistId = null;
    
    // Patrón 1: canonical URL
    const canonicalMatch = html.match(/canonical.*?artist\/([a-z0-9]+)\//i);
    if (canonicalMatch) artistId = canonicalMatch[1];
    
    // Patrón 2: href="/artist/ID/"
    if (!artistId) {
      const hrefMatch = html.match(/href=["']\/artist\/([a-z0-9]+)\//i);
      if (hrefMatch) artistId = hrefMatch[1];
    }
    
    // Patrón 3: JSON-LD o data attributes
    if (!artistId) {
      const dataMatch = html.match(/"@id".*?artist\/([a-z0-9]+)/i);
      if (dataMatch) artistId = dataMatch[1];
    }
    
    const artistSlug = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const songstatsUrl = artistId ? `https://songstats.com/artist/${artistId}/${artistSlug}` : null;
    
    const result = {
      success: true,
      artist: artist,
      tracklists_id: artistId,
      songstats_url: songstatsUrl,
      cached: false
    };
    
    cache[cleanName] = result;
    return res.json(result);
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
