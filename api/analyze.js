export default async function handler(req, res) {
  // Permitir CORS
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
    console.log('Imagen convertida a base64, tamaño:', base64.length);
    
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
              text: `Look at this Songstats screenshot and extract these metrics. Return ONLY a valid JSON object with no additional text:
{
  "artistName": "artist name",
  "followers": "exact value shown",
  "streams": "exact value shown",
  "playlists": "exact value shown",
  "playlistReach": "exact value shown",
  "charts": "exact value shown",
  "shazams": "exact value shown",
  "videos": "exact value shown",
  "views": "exact value shown",
  "djSupports": "exact value shown"
}`
            }
          ]
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const data = await claudeResponse.json();
    console.log('Respuesta de Claude:', JSON.stringify(data));
    
    // Verificar que la respuesta tenga el formato correcto
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      throw new Error('Invalid response format from Claude');
    }
    
    const content = data.content[0].text;
    console.log('Texto extraído:', content);
    
    // Limpiar el texto y parsear JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    const metrics = JSON.parse(jsonMatch[0]);
    console.log('Métricas parseadas:', metrics);
    
    res.status(200).json({ 
      success: true, 
      metrics 
    });
    
  } catch (error) {
    console.error('Error completo:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
