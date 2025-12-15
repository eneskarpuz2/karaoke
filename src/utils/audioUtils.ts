// audioUtils.ts
import { Image, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

export const toFileUri = (p?: string | null) =>
  p ? (p.startsWith('file://') ? p : `file://${p}`) : p;

export const stripFileScheme = (p?: string | null) =>
  p?.startsWith('file://') ? p.slice(7) : p;

const ffPath = (p: string) => stripFileScheme(p) as string;

const runFFmpeg = async (args: string) => {
  const session = await FFmpegKit.execute(args);
  const rc = await session.getReturnCode();
  if (ReturnCode.isSuccess(rc)) return;
  throw new Error(`FFmpeg failed:\n${await session.getAllLogsAsString()}`);
};

/**
 * Copy/download bundled asset to cache so FFmpeg can read it from disk.
 */
export const ensureSongOnDisk = async (
  asset: number,
  outPath: string = `${RNFS.CachesDirectoryPath}/song.mp3`,
) => {
  if (await RNFS.exists(outPath)) return outPath;

  const uri = Image.resolveAssetSource(asset)?.uri;
  if (!uri) throw new Error('Cannot resolve mp3 asset: no uri');

  if (uri.startsWith('file://')) {
    await RNFS.copyFile(ffPath(uri), outPath);
    return outPath;
  }

  if (/^https?:\/\//.test(uri)) {
    const { statusCode } = await RNFS.downloadFile({
      fromUrl: uri,
      toFile: outPath,
    }).promise;
    if (statusCode && statusCode >= 400)
      throw new Error(`Failed to download mp3. status=${statusCode}`);
    return outPath;
  }

  if (Platform.OS === 'android') {
    // android/app/src/main/assets/audio/song.mp3
    await RNFS.copyFileAssets('audio/song.mp3', outPath);
    return outPath;
  }

  throw new Error(`Unsupported mp3 uri: ${uri}`);
};

export const resolvePlayableUri = async (
  src: number | string | null | undefined,
) => {
  if (!src) return src as any;

  if (typeof src === 'number') {
    return toFileUri(await ensureSongOnDisk(src))!;
  }

  if (/^https?:\/\//.test(src) || src.startsWith('file://')) return src;
  return toFileUri(src)!;
};

export const convertToWav = async (
  input: string,
  output: string,
  opts: { sampleRate?: number; channels?: number } = {},
) => {
  const { sampleRate = 44100, channels = 1 } = opts;

  await runFFmpeg(
    `-y -i "${ffPath(
      input,
    )}" -vn -ac ${channels} -ar ${sampleRate} -c:a pcm_s16le "${ffPath(
      output,
    )}"`,
  );

  return ffPath(output);
};

export const mergeAudio = async (
  musicPath: string,
  recordedPath: string,
  opts: {
    musicGain?: number;
    micGain?: number;
    outputPath?: string;
    sampleRate?: number;
  } = {},
) => {
  const { musicGain = 0.3, micGain = 2.0, sampleRate = 44100 } = opts;
  const output =
    opts.outputPath ?? `${RNFS.CachesDirectoryPath}/karaoke_mix.wav`;

  const cmd = [
    `-y`,
    `-i "${ffPath(musicPath)}"`,
    `-i "${ffPath(recordedPath)}"`,
    `-filter_complex ` +
      `"` +
      `[0:a]volume=${musicGain},aformat=sample_fmts=s16:sample_rates=${sampleRate}:channel_layouts=stereo[m];` +
      `[1:a]volume=${micGain},aformat=sample_fmts=s16:sample_rates=${sampleRate}:channel_layouts=stereo[v];` +
      `[m][v]amix=inputs=2:duration=longest:dropout_transition=2:weights=1 2[out]` +
      `"`,
    `-map "[out]" -c:a pcm_s16le -ar ${sampleRate} -ac 2 "${ffPath(output)}"`,
  ].join(' ');

  await runFFmpeg(cmd);
  return ffPath(output);
};
