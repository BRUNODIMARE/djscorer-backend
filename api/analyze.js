  export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { screenshotUrl } = req.body;
    console.log('Screenshot URL recibido:', screenshotUrl);
    
    // Obtener screenshot
    const imgResponse = await fetch(screenshotUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch screenshot: ${imgResponse.status}`);
    }
    
    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    console.log('Imagen convertida, tamaño:', base64.length);
    
    // Llamar a Claude con el prompt mejorado
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64
              }
            },
            {
              type: 'text',
              text: `You are analyzing a Songstats artist profile screenshot. Extract ALL visible metrics.

IMPORTANT: Look for these metrics in the screenshot:
- Artist name (usually at the top with verification badge)
- Followers (look for "Followers" label)
- Streams (look for "Streams" label)
- Playlists (look for "Playlists" label)
- Playlist Reach (look for "Playlist Reach" label)
- Charts (look for "Charts" label)
- Shazams (look for "Shazams" label)
- Videos (look for "Videos" label)
- Views (look for "Views" label)
- DJ Supports (look for "DJ Supports" or "Supports" label)

INSTRUCTIONS:
1. Look carefully at each metric section
2. Extract the EXACT value shown (e.g., "14.5K", "613K", "140")
3. If a metric is not visible in the screenshot, use "0"
4. Keep the format as shown (K for thousands, M for millions)

Return ONLY a JSON object with this exact structure:
{
  "artistName": "exact artist name",
  "followers": "exact value or 0",
  "streams": "exact value or 0",
  "playlists": "exact value or 0",
  "playlistReach": "exact value or 0",
  "charts": "exact value or 0",
  "shazams": "exact value or 0",
  "videos": "exact value or 0",
  "views": "exact value or 0",
  "djSupports": "exact value or 0"
}

NO additional text, ONLY the JSON object.`
            }
          ]
        }]
      })
    });

    const data = await claudeResponse.json();
    console.log('Respuesta de Claude:', JSON.stringify(data));
    
    if (data.error) {
      throw new Error(`Claude API: ${data.error.message}`);
    }
    
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const metrics = JSON.parse(jsonMatch[0]);
    
    // Validar campos faltantes
    const requiredFields = [
      'artistName', 'followers', 'streams', 'playlists', 
      'playlistReach', 'charts', 'shazams', 'videos', 'views', 'djSupports'
    ];
    
    requiredFields.forEach(field => {
      if (!metrics[field] || metrics[field] === '') {
        metrics[field] = field === 'artistName' ? 'Unknown Artist' : '0';
      }
    });
    
    console.log('Métricas finales:', metrics);
    
    res.status(200).json({ 
      success: true, 
      metrics 
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
