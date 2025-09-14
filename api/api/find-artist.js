export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { instagram } = req.body;
    const username = instagram.replace('@', '').replace('https://www.instagram.com/', '').split('/')[0].toLowerCase();
    
    // LLAMADA REAL A BROWSERLESS
    const response = await fetch('https://chrome.browserless.io/content?token=2T3HOcXs5RvAbb6c0099c9c03d87fe1c48b9e5fb8c4194241', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `https://songstats.com/search?q=${username}`,
        selector: 'a[href*="/artist/"]'
      })
    });
    
    const html = await response.text();
    const match = html.match(/href="(\/artist\/[^"]+)"/);
    
    if (match) {
      return res.status(200).json({ 
        success: true,
        songstatsUrl: `https://songstats.com${match[1]}`
      });
    }
    
    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
