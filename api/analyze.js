export default async function handler(req, res) {
  // Permitir conexiones desde Bolt
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
    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    console.log('Imagen convertida a base64, llamando a Claude...');
    
    // Llamar a Claude
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
              text: `Analiza este screenshot de Songstats y extrae TODAS las métricas.
              Devuelve SOLO un objeto JSON con este formato exacto:
              {
                "artistName": "nombre del artista",
                "followers": "valor exacto como aparece",
                "streams": "valor exacto como aparece", 
                "playlists": "valor exacto",
                "playlistReach": "valor exacto",
                "charts": "valor exacto",
                "shazams": "valor exacto",
                "videos": "valor exacto",
                "views": "valor exacto",
                "djSupports": "valor exacto"
              }
              Si no puedes ver algún valor, pon "0".`
            }
          ]
        }]
      })
    });

    const data = await claudeResponse.json();
    console.log('Respuesta de Claude:', data);
    
    const content = data.content[0].text;
    const metrics = JSON.parse(content);
    
    res.status(200).json({ 
      success: true, 
      metrics 
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
