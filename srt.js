const toMs = time => {
  const [hms, ms] = time.trim().split(',');
  const [hh, mm, ss] = hms.split(':').map(Number);
  return (hh * 3600 + mm * 60 + ss) * 1000 + Number(ms);
};

export const parseSrt = (srtText = '') => {
  const clean = srtText
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .trim();

  if (!clean) return [];

  const blocks = clean.split(/\n\s*\n/);
  const cues = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    const timeIdx = lines.findIndex(l => l.includes('-->'));
    if (timeIdx === -1) continue;

    const m = lines[timeIdx].match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/,
    );
    if (!m) continue;

    const startMs = toMs(m[1]);
    const endMs = toMs(m[2]);
    const text = lines.slice(timeIdx + 1).join('\n');

    cues.push({ startMs, endMs, text });
  }

  cues.sort((a, b) => a.startMs - b.startMs);
  return cues;
};
