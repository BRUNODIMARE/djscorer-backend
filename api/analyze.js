// Función para parsear valores con K, M, B
function parseMetricValue(value) {
  if (!value || value === '0') return 0;
  
  value = value.toString().toUpperCase();
  const num = parseFloat(value.replace(/[^\d.]/g, ''));
  
  if (value.includes('B')) return num * 1000000000;
  if (value.includes('M')) return num * 1000000;
  if (value.includes('K')) return num * 1000;
  
  return num;
}

// Función para calcular el score
function calculateSimpleScore(metrics) {
  let score = 0;
  
  const followers = parseMetricValue(metrics.followers);
  const streams = parseMetricValue(metrics.streams);
  const playlists = parseMetricValue(metrics.playlists);
  const charts = parseInt(metrics.charts) || 0;
  
  // Followers scoring (30% weight)
  if (followers >= 10000000) score += 30;
  else if (followers >= 5000000) score += 28;
  else if (followers >= 2000000) score += 26;
  else if (followers >= 1000000) score += 24;
  else if (followers >= 500000) score += 20;
  else if (followers >= 250000) score += 16;
  else if (followers >= 100000) score += 12;
  else if (followers >= 50000) score += 8;
  else if (followers >= 20000) score += 5;
  else score += 2;
  
  // Streams scoring (35% weight)
  if (streams >= 1000000000) score += 35;
  else if (streams >= 500000000) score += 32;
  else if (streams >= 250000000) score += 28;
  else if (streams >= 100000000) score += 24;
  else if (streams >= 50000000) score += 20;
  else if (streams >= 25000000) score += 16;
  else if (streams >= 10000000) score += 12;
  else if (streams >= 5000000) score += 8;
  else if (streams >= 1000000) score += 4;
  else score += 1;
  
  // Playlists scoring (25% weight)
  if (playlists >= 30000) score += 25;
  else if (playlists >= 20000) score += 23;
  else if (playlists >= 15000) score += 21;
  else if (playlists >= 10000) score += 19;
  else if (playlists >= 5000) score += 16;
  else if (playlists >= 2500) score += 13;
  else if (playlists >= 1000) score += 10;
  else if (playlists >= 500) score += 7;
  else if (playlists >= 100) score += 4;
  else score += 2;
  
  // Charts scoring (10% weight)
  if (charts >= 2000) score += 10;
  else if (charts >= 1000) score += 8;
  else if (charts >= 500) score += 6;
  else if (charts >= 250) score += 5;
  else if (charts >= 100) score += 4;
  else if (charts >= 50) score += 3;
  else score += 1;
  
  return Math.min(Math.round(score), 100);
}

// Función para determinar el tier
function getTier(score) {
  if (score >= 85) return 'TIER 1 - Global Headliner';
  if (score >= 70) return 'TIER 2 - Regional Star';
  if (score >= 55) return 'TIER 3 - Rising Talent';
  if (score >= 40) return 'TIER 4 - Local Favorite';
  return 'TIER 5 - Beginner';
}

// Función para generar análisis local
function generateLocalAnalysis(metrics, score, tier) {
  const followers = parseMetricValue(metrics.followers);
  const streams = parseMetricValue(metrics.streams);
  const playlists = parseMetricValue(metrics.playlists);
  const ratio = followers > 0 ? streams / followers : 0;
  
  let genre = "Electronic/Dance";
  if (ratio > 500) genre = "Tech House/Techno";
  else if (ratio > 300) genre = "House/Progressive";
  else if (ratio > 150) genre = "Commercial Dance/EDM";
  
  const similarArtistsByTier = {
    'TIER 1': ["David Guetta", "Calvin Harris", "Tiësto"],
    'TIER 2': ["Fisher", "Chris Lake", "Vintage Culture"],
    'TIER 3': ["Mason Maynard", "Beltran", "Wade"],
    'TIER 4': ["Local DJs", "Emerging Artists", "Residents"],
    'TIER 5': ["Bedroom DJs", "Beginners", "Amateur Artists"]
  };
  
  const tierKey = tier.split(' - ')[0];
  
  return {
    genre_analysis: `${genre} artist with ${ratio > 200 ? 'strong' : 'moderate'} engagement metrics. Market position suggests ${score >= 70 ? 'international' : 'regional'} appeal.`,
    similar_artists: similarArtistsByTier[tierKey] || ["Independent Artists"],
    strengths: [
      ratio > 200 ? "Excellent streams-to-followers ratio" : "Growing streaming presence",
      playlists > 2000 ? "Strong playlist penetration" : "Building playlist presence",
      followers > 100000 ? "Established fanbase" : "Developing audience"
    ],
    weaknesses: [
      followers < 50000 ? "Need to grow social media following" : null,
      playlists < 1000 ? "Limited playlist reach" : null,
      ratio < 150 ? "Low engagement rate" : null
    ].filter(Boolean),
    growth_strategy: {
      immediate: followers < 100000 ? "Focus on social media growth - aim for 20% increase in 30 days" : "Maintain release consistency - 1 track per month minimum",
      quarterly: `Target: ${Math.round(followers * 1.5 / 1000)}K followers, ${Math.round(streams * 1.3 / 1000000)}M streams`,
      breakthrough: score < 70 ? "Collaborate with established artists in your genre" : "Launch international tour or residency"
    },
    revenue: {
      booking_fee: score >= 85 ? "€15,000 - €50,000" :
                   score >= 70 ? "€5,000 - €15,000" :
                   score >= 55 ? "€2,000 - €5,000" :
                   score >= 40 ? "€500 - €2,000" :
                   "€200 - €500",
      streaming_monthly: `€${Math.round(streams / 250000) * 100}`,
      touring_level: score >= 70 ? "International" : score >= 55 ? "Regional" : "Local"
    },
    opportunities: {
      labels: score >= 70 ? ["Defected", "Toolroom", "Anjunabeats"] :
              score >= 55 ? ["Solid Grooves", "Repopulate Mars", "Hot Creations"] :
              ["Local Labels", "Independent Release", "Self-Release"],
      festivals: score >= 70 ? ["Tomorrowland", "Ultra", "EDC"] :
                 score >= 55 ? ["Medusa", "Dreambeach", "Regional Festivals"] :
                 ["Local Events", "Club Nights", "Warm-up Slots"],
      collaborations: score >= 55 ? ["Artists one tier above", "Remix opportunities"] :
                      ["Local collaborations", "DJ collectives"]
    },
    custom_insight: ratio > 300 ? "Exceptional engagement rate suggests highly dedicated fanbase" :
                    ratio > 150 ? "Solid engagement indicates growth potential" :
                    "Building phase - prioritize consistent content",
    next_tier_requirements: `To reach ${score >= 85 ? 'maintain TIER 1' : score >= 70 ? 'TIER 1' : score >= 55 ? 'TIER 2' : 'TIER 3'}: Need ${score >= 70 ? '10M+' : score >= 55 ? '1M+' : '100K+'} followers and ${score >= 70 ? '1B+' : score >= 55 ? '100M+' : '10M+'} streams`
  };
}

// HANDLER PRINCIPAL - EXPORT AL FINAL
module.exports = async function handler(req, res) {
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
    
    // Llamar a Claude para extraer métricas
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
    console.log('Respuesta de Claude:', JSON.stringify(extractData));
    
    if (extractData.error) {
      throw new Error(`Claude API: ${extractData.error.message}`);
    }
    
    const content = extractData.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const metrics = JSON.parse(jsonMatch[0]);
    
    // Calcular score y generar análisis
    const simpleScore = calculateSimpleScore(metrics);
    const tier = getTier(simpleScore);
    const enrichedAnalysis = generateLocalAnalysis(metrics, simpleScore, tier);
    
    // Respuesta final
    const finalResponse = {
      success: true,
      metrics,
      score: simpleScore,
      tier: tier,
      ...enrichedAnalysis
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
};
