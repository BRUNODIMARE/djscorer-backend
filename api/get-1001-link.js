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
  
  // Limpiar nombre del artista para URL
  const cleanName = artist
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  const tracklistsUrl = `https://www.1001tracklists.com/dj/${cleanName}/index.html`;
  
  return res.json({
    success: true,
    artist: artist,
    tracklists_url: tracklistsUrl
  });
};
