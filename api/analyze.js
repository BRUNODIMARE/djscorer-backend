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
    
    // Calcular score básico
    const simpleScore = calculateSimpleScore(metrics);
    const tier = getTier(simpleScore);
    
    // Generar análisis enriquecido localmente (sin segunda llamada a Claude por ahora)
    const enrichedAnalysis = generateLocalAnalysis(metrics, simpleScore, tier);
    
    // Respuesta final con todos los datos
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
}

// Función para generar análisis local enriquecido
function generateLocalAnalysis(metrics, score, tier) {
  const followers = parseMetricValue(metrics.followers);
  const streams = parseMetricValue(metrics.streams);
  const playlists = parseInt(metrics.playlists) || 0;
  const ratio = streams / followers;
  
  // Determinar género basado en métricas
  let genre = "Electronic/Dance";
  if (ratio > 500) genre = "Tech House/Techno";
  else if (ratio > 300) genre = "House/Progressive";
  else if (ratio > 150) genre = "Commercial Dance/EDM";
  
  // Artistas similares basados en tier
  const similarArtistsByTier = {
    'TIER 1': ["David Guetta", "Martin Garrix", "Tiësto"],
    'TIER 2': ["Fisher", "Chris Lake", "Vintage Culture"],
    'TIER 3': ["Mason Maynard", "Beltran", "Wade"],
    'TIER 4': ["Local DJs", "Emerging Artists", "Residents"],
    'TIER 5': ["Bedroom DJs", "Beginners", "Amateur Artists"]
  };
  
  const tierKey = tier.split(' - ')[0];
  
  return {
    genre_analysis: `${genre} artist with ${ratio > 200 ? 'strong' : 'moderate'} engagement metrics. Market position suggests ${tier.includes('1') || tier.includes('2') ? 'international' : 'regional'} appeal.`,
    
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
      immediate: followers < 100000 ? 
        "Focus on social media growth - aim for 20% increase in 30 days" : 
        "Maintain release consistency - 1 track per month minimum",
      quarterly: `Target: ${Math.round(followers * 1.5 / 1000)}K followers, ${Math.round(streams * 1.3 / 1000000)}M streams`,
      breakthrough: score < 70 ? 
        "Collaborate with established artists in your genre" : 
        "Launch international tour or residency"
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
      labels: score >= 70 ? 
        ["Defected", "Toolroom", "Anjunabeats"] :
        score >= 55 ?
        ["Solid Grooves", "Repopulate Mars", "Hot Creations"] :
        ["Local Labels", "Independent Release", "Self-Release"],
      
      festivals: score >= 70 ?
        ["Tomorrowland", "Ultra", "EDC"] :
        score >= 55 ?
        ["Medusa", "Dreambeach", "Regional Festivals"] :
        ["Local Events", "Club Nights", "Warm-up Slots"],
      
      collaborations: score >= 55 ?
        ["Artists one tier above", "Remix opportunities", "Label compilations"] :
        ["Local collaborations", "DJ collectives", "Producer groups"]
    },
    
    custom_insight: ratio > 300 ? 
      "Exceptional engagement rate suggests highly dedicated fanbase - perfect for exclusive releases and VIP experiences" :
      ratio > 150 ?
      "Solid engagement indicates growth potential - focus on converting casual listeners to followers" :
      "Building phase - prioritize consistent content and authentic fan connections",
    
    next_tier_requirements: `To reach ${score >= 85 ? 'maintain TIER 1' : score >= 70 ? 'TIER 1' : score >= 55 ? 'TIER 2' : score >= 40 ? 'TIER 3' : 'TIER 4'}: Need ${score >= 70 ? '500K+' : score >= 55 ? '250K+' : score >= 40 ? '100K+' : '50K+'} followers and ${score >= 70 ? '100M+' : score >= 55 ? '50M+' : score >= 40 ? '10M+' : '5M+'} streams`
  };
}

// Funciones auxiliares
function calculateSimpleScore(metrics) {
  let score = 0;
  
  const followers = parseMetricValue(metrics.followers);
  const streams = parseMetricValue(metrics.streams);
  const playlists = parseInt(metrics.playlists) || 0;
  const charts = parseInt(metrics.charts) || 0;
  
  // Calcular score
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
