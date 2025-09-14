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
    
    // PRIMER PASO: Extraer métricas del screenshot
    const extractResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
              text: `Extract ALL visible metrics from this Songstats screenshot.
Return ONLY a JSON object with these exact fields:
{
  "artistName": "exact artist name",
  "followers": "exact value or 0",
  "streams": "exact value or 0",
  "playlists": "exact value or 0",
  "playlistReach": "exact value or 0",
  "charts": "exact value or 0"
}
NO additional text, ONLY the JSON object.`
            }
          ]
        }]
      })
    });
    
    const extractData = await extractResponse.json();
    console.log('Métricas extraídas:', JSON.stringify(extractData));
    
    if (extractData.error) {
      throw new Error(`Claude API: ${extractData.error.message}`);
    }
    
    const content = extractData.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const metrics = JSON.parse(jsonMatch[0]);
    
    // SEGUNDO PASO: Análisis profesional detallado
    const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are an elite DJ industry analyst with 15+ years of experience. Analyze these metrics and provide SPECIFIC, ACTIONABLE insights.

ARTIST DATA:
- Name: ${metrics.artistName || 'Unknown Artist'}
- Total Followers: ${metrics.followers || '0'}
- Total Streams: ${metrics.streams || '0'}
- Playlist Count: ${metrics.playlists || '0'}
- Playlist Reach: ${metrics.playlistReach || '0'}
- Chart Entries: ${metrics.charts || '0'}

YOUR ANALYSIS MUST INCLUDE:

1. SCORE CALCULATION (0-100):
   - Followers (30%): <50K=10pts, 50-100K=25pts, 100-250K=45pts, 250-500K=65pts, 500K-1M=80pts, >1M=100pts
   - Streams (35%): <1M=5pts, 1-10M=20pts, 10-50M=40pts, 50-100M=60pts, 100-500M=80pts, >500M=100pts
   - Playlists (25%): <100=10pts, 100-500=25pts, 500-2000=45pts, 2000-5000=70pts, >5000=100pts
   - Charts (10%): <50=20pts, 50-200=40pts, 200-500=70pts, >500=100pts

2. TIER CLASSIFICATION:
   - TIER 1 (85-100): Global Headliner
   - TIER 2 (70-84): Regional Star
   - TIER 3 (55-69): Rising Talent
   - TIER 4 (40-54): Local Favorite
   - TIER 5 (<40): Beginner

3. SPECIFIC ANALYSIS:
   - Genre identification
   - Similar artists (name real DJs)
   - Engagement ratio analysis
   - Market position

4. GROWTH STRATEGY:
   - Immediate actions (30 days)
   - Quarterly goals
   - Breakthrough strategy

5. REVENUE & OPPORTUNITIES:
   - Booking fee range in euros
   - Suitable festivals/venues
   - Label recommendations

Return a JSON with this structure:
{
  "score": [number],
  "tier": "TIER X - [Name]",
  "genre_analysis": "[genre and style]",
  "similar_artists": ["artist1", "artist2", "artist3"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "growth_strategy": {
    "immediate": "[30-day action]",
    "quarterly": "[3-month goal]",
    "breakthrough": "[next tier strategy]"
  },
  "revenue": {
    "booking_fee": "€X - €Y",
    "streaming_monthly": "€X",
    "touring_level": "local/regional/international"
  },
  "opportunities": {
    "labels": ["label1", "label2"],
    "festivals": ["festival1", "festival2"],
    "collaborations": ["artist1", "artist2"]
  },
  "custom_insight": "[unique observation]",
  "next_tier_requirements": "[what they need for next tier]"
}`
        }]
      })
    });
    
    const analysisData = await analysisResponse.json();
    console.log('Análisis completo:', JSON.stringify(analysisData));
    
    if (analysisData.error) {
      // Si falla el análisis, devolver métricas básicas con score simple
      const simpleScore = calculateSimpleScore(metrics);
      return res.status(200).json({ 
        success: true, 
        metrics,
        analysis: {
          score: simpleScore,
          tier: getTier(simpleScore)
        }
      });
    }
    
    const analysisContent = analysisData.content[0].text;
    const analysisMatch = analysisContent.match(/\{[\s\S]*\}/);
    
    let analysis = {};
    if (analysisMatch) {
      try {
        analysis = JSON.parse(analysisMatch[0]);
      } catch (e) {
        console.error('Error parsing analysis:', e);
        const simpleScore = calculateSimpleScore(metrics);
        analysis = {
          score: simpleScore,
          tier: getTier(simpleScore)
        };
      }
    }
    
    // Combinar métricas y análisis
    const finalResponse = {
      success: true,
      metrics,
      analysis,
      // Mantener compatibilidad con formato anterior
      score: analysis.score,
      tier: analysis.tier,
      ...analysis
    };
    
    console.log('Respuesta final:', JSON.stringify(finalResponse));
    res.status(200).json(finalResponse);
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// Funciones auxiliares para cálculo básico si falla el análisis
function calculateSimpleScore(metrics) {
  let score = 0;
  
  // Convertir valores a números
  const followers = parseMetricValue(metrics.followers);
  const streams = parseMetricValue(metrics.streams);
  const playlists = parseInt(metrics.playlists) || 0;
  const charts = parseInt(metrics.charts) || 0;
  
  // Calcular score básico
  if (followers > 1000000) score += 30;
  else if (followers > 500000) score += 24;
  else if (followers > 250000) score += 20;
  else if (followers > 100000) score += 15;
  else if (followers > 50000) score += 10;
  else score += 5;
  
  if (streams > 500000000) score += 35;
  else if (streams > 100000000) score += 28;
  else if (streams > 50000000) score += 21;
  else if (streams > 10000000) score += 14;
  else if (streams > 1000000) score += 7;
  else score += 2;
  
  if (playlists > 5000) score += 25;
  else if (playlists > 2000) score += 18;
  else if (playlists > 500) score += 11;
  else if (playlists > 100) score += 6;
  else score += 3;
  
  if (charts > 500) score += 10;
  else if (charts > 200) score += 7;
  else if (charts > 50) score += 4;
  else score += 2;
  
  return Math.min(Math.round(score), 100);
}

function parseMetricValue(value) {
  if (!value || value === '0') return 0;
  const num = parseFloat(value.replace(/[^\d.]/g, ''));
  if (value.includes('M')) return num * 1000000;
  if (value.includes('K')) return num * 1000;
  return num;
}

function getTier(score) {
  if (score >= 85) return 'TIER 1 - Global Headliner';
  if (score >= 70) return 'TIER 2 - Regional Star';
  if (score >= 55) return 'TIER 3 - Rising Talent';
  if (score >= 40) return 'TIER 4 - Local Favorite';
  return 'TIER 5 - Beginner';
}
// Updated: Force redeploy
