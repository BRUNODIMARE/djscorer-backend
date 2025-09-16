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
    const cleanName = artist.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const tracklistsUrl = `https://www.1001tracklists.com/dj/${cleanName}/index.html`;
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(tracklistsUrl)}`;
    
    const response = await fetch(scrapingBeeUrl);
    const html = await response.text();
    
    // Buscar múltiples patrones posibles
    let artistId = null;
    
    // Patrón 1: /artist/ID/nombre
    const match1 = html.match(/\/artist\/([a-z0-9]+)\//i);
    if (match1) artistId = match1[1];
    
    // Patrón 2: URL completa en meta tags
    const match2 = html.match(/https?:\/\/(?:www\.)?1001tracklists\.com\/artist\/([a-z0-9]+)\//i);
    if (!artistId && match2) artistId = match2[1];
    
    // Patrón 3: data-artist-id o similar
    const match3 = html.match(/artist[_-]?id["\s:=]+["']?([a-z0-9]+)/i);
    if (!artistId && match3) artistId = match3[1];
    
    const artistSlug = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const songstatsUrl = artistId ? `https://songstats.com/artist/${artistId}/${artistSlug}` : null;
    
    return res.json({
      success: true,
      artist: artist,
      tracklists_id: artistId,
      songstats_url: songstatsUrl,
      html_preview: html.substring(0, 500) // Ver primeros 500 chars del HTML
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
