function calculateSimpleScore(metrics) {
  let score = 0;
  
  const followers = parseMetricValue(metrics.followers);
  const streams = parseMetricValue(metrics.streams);
  const playlists = parseMetricValue(metrics.playlists);
  const charts = parseInt(metrics.charts) || 0;
  
  // Followers scoring (30% weight) - CALIBRADO CORRECTAMENTE
  if (followers >= 10000000) score += 30;      // 10M+ = full points (Black Coffee level)
  else if (followers >= 5000000) score += 28;   // 5M+
  else if (followers >= 2000000) score += 26;   // 2M+ (CamelPhat level)
  else if (followers >= 1000000) score += 24;   // 1M+
  else if (followers >= 500000) score += 20;    // 500K+
  else if (followers >= 250000) score += 16;    // 250K+
  else if (followers >= 100000) score += 12;    // 100K+
  else if (followers >= 50000) score += 8;      // 50K+
  else if (followers >= 20000) score += 5;      // 20K+
  else score += 2;
  
  // Streams scoring (35% weight) - CORREGIDO PARA BILLIONS
  if (streams >= 1000000000) score += 35;       // 1B+ = full points
  else if (streams >= 500000000) score += 32;   // 500M+
  else if (streams >= 250000000) score += 28;   // 250M+
  else if (streams >= 100000000) score += 24;   // 100M+
  else if (streams >= 50000000) score += 20;    // 50M+
  else if (streams >= 25000000) score += 16;    // 25M+
  else if (streams >= 10000000) score += 12;    // 10M+
  else if (streams >= 5000000) score += 8;      // 5M+
  else if (streams >= 1000000) score += 4;      // 1M+
  else score += 1;
  
  // Playlists scoring (25% weight) - AJUSTADO PARA 37K
  if (playlists >= 30000) score += 25;          // 30K+ = full points
  else if (playlists >= 20000) score += 23;     // 20K+
  else if (playlists >= 15000) score += 21;     // 15K+
  else if (playlists >= 10000) score += 19;     // 10K+
  else if (playlists >= 5000) score += 16;      // 5K+
  else if (playlists >= 2500) score += 13;      // 2.5K+
  else if (playlists >= 1000) score += 10;      // 1K+
  else if (playlists >= 500) score += 7;        // 500+
  else if (playlists >= 100) score += 4;        // 100+
  else score += 2;
  
  // Charts scoring (10% weight)
  if (charts >= 2000) score += 10;              // 2000+ = full points
  else if (charts >= 1000) score += 8;          // 1000+
  else if (charts >= 500) score += 6;           // 500+
  else if (charts >= 250) score += 5;           // 250+
  else if (charts >= 100) score += 4;           // 100+
  else if (charts >= 50) score += 3;            // 50+
  else score += 1;
  
  return Math.min(Math.round(score), 100);
}

// TAMBIÉN actualiza parseMetricValue para manejar BILLIONS correctamente:
function parseMetricValue(value) {
  if (!value || value === '0') return 0;
  
  // Limpiar el string
  value = value.toString().toUpperCase();
  const num = parseFloat(value.replace(/[^\d.]/g, ''));
  
  // Detectar unidades
  if (value.includes('B')) return num * 1000000000;  // Billions
  if (value.includes('M')) return num * 1000000;     // Millions  
  if (value.includes('K')) return num * 1000;        // Thousands
  
  return num;
}
