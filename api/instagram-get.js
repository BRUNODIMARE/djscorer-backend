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
  
  const clean = handle.replace('@', '').replace(/instagram\.com\//g, '');
  
  return res.json({
    success: true,
    instagram: clean,
    songstats_url: `https://songstats.com/artist/${clean}`,
    message: `Try searching for ${clean} on Songstats`
  });
}
