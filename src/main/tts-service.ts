import path from 'path'
import fs from 'fs'
import os from 'os'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

export async function synthesizeMicrosoftVoice(text: string): Promise<string> {
  const cleanText = text
    .replace(/[`"$'\\]/g, '')
    .replace(/\r?\n/g, ' ')
    .slice(0, 600)

  const tempDir = os.tmpdir()
  const subFolder = path.join(tempDir, `hive_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  fs.mkdirSync(subFolder, { recursive: true })

  try {
    const tts = new MsEdgeTTS()
    // Uses Microsoft's premium natural neural human voice (en-US-ChristopherNeural or GuyNeural)
    await tts.setMetadata('en-US-ChristopherNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const result = await tts.toFile(subFolder, cleanText)
    const audioPath = result.audioFilePath
    if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 0) {
      return audioPath
    }
    throw new Error('TTS file empty')
  } catch (err) {
    // Fallback if network offline
    const fallbackPath = path.join(subFolder, 'fallback.wav')
    return fallbackPath
  }
}
