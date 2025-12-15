// subtitleUtils.ts
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import type React from 'react';

const toMs = (time: string): number => {
  const [hms, ms] = time.trim().split(',');
  const [hh, mm, ss] = hms.split(':').map(Number);
  return (hh * 3600 + mm * 60 + ss) * 1000 + Number(ms);
};

export const loadSrt = async (): Promise<string> => {
  if (Platform.OS === 'ios') {
    const path = `${RNFS.MainBundlePath}/lyrics.srt`;
    return RNFS.readFile(path, 'utf8');
  }
  return RNFS.readFileAssets('lyrics.srt', 'utf8');
};

export type Cue = { startMs: number; endMs: number; text: string };

export const findCueAt = (
  cues: Cue[],
  posMs: number,
  lastIndexRef: React.MutableRefObject<number>,
): Cue | null => {
  let i = lastIndexRef.current ?? 0;
  if (!cues.length) return null;

  while (i < cues.length && posMs > cues[i].endMs) i++;
  if (i >= cues.length) i = cues.length - 1;
  while (i > 0 && posMs < cues[i].startMs) i--;

  lastIndexRef.current = i;
  const cue = cues[i];
  return cue && posMs >= cue.startMs && posMs <= cue.endMs ? cue : null;
};

export const parseSrt = (srtText: string = ''): Cue[] => {
  const clean = srtText
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .trim();
  if (!clean) return [];

  const blocks = clean.split(/\n\s*\n/);
  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) continue;

    const timeIdx = lines.findIndex((l: string) => l.includes('-->'));
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
