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
    
    // Intentar obtener el screenshot
    const imgResponse = await fetch(screenshotUrl);
    console.log('Screenshot response status:', imgResponse.status);
    
    if (!imgResponse.ok) {
      throw new Error(`Screenshot service returned ${imgResponse.status}`);
    }
    
    const contentType = imgResponse.headers.get('content-type');
    console.log('Content type:', contentType);
    
    // Verificar si es una imagen
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Response is not an image');
    }
    
    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    console.log('Image size:', base64.length);
    
    if (base64.length < 1000) {
      throw new Error('Image too small, probably an error page');
    }
    
    // Llamar a Claude con tu API key que SÍ tiene créditos
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
                media_type: contentType || 'image/png',
                data: base64
              }
            },
            {
              type: 'text',
              text: `Extract these metrics from the Songstats screenshot. Return ONLY a JSON object:
{
  "artistName": "name",
  "followers": "value",
  "streams": "value",
  "playlists": "value",
  "playlistReach": "value",
  "charts": "value",
  "shazams": "value",
  "videos": "value",
  "views": "value",
  "djSupports": "value"
}`
            }
          ]
        }]
      })
    });

    const claudeData = await claudeResponse.json();
    console.log('Claude response:', JSON.stringify(claudeData));
    
    if (claudeData.error) {
      throw new Error(`Claude API: ${claudeData.error.message}`);
    }
    
    const content = claudeData.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const metrics = JSON.parse(jsonMatch[0]);
    
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
