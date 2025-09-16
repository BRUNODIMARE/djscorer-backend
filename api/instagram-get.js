module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { handle } = req.query;
  
  if (!handle) {
    return res.json({ error: 'No handle provided' });
  }
  
  // Limpiar el handle - extraer solo el username
  let clean = handle
    .replace('@', '')
    .replace(/https?:\/\/(www\.)?instagram\.com\//g, '')
    .replace(/\//g, '')
    .trim();
  
  // Construir URL simple de Songstats (sin ID real)
  const songstatsUrl = `https://songstats.com/artist/${clean}`;
  
  return res.json({
    success: true,
    instagram: clean,
    songstats_url: songstatsUrl,
    message: `Try searching manually for ${clean} on Songstats`
  });
}
