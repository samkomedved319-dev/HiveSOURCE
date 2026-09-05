import { ipcMain } from 'electron'
import { AccessToken } from 'livekit-server-sdk'

// Configurable local or cloud LiveKit room token generator
export function registerLiveKitHandlers() {
  ipcMain.handle('webrtc:getToken', async (_e, roomName: string, identity: string) => {
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey'
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret'
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://127.0.0.1:7880'

    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: identity || `user_${Date.now()}`,
      })
      at.addGrant({
        roomJoin: true,
        room: roomName || 'hive-voice-room',
        canPublish: true,
        canSubscribe: true,
      })
      const token = await at.toJwt()
      return { token, url: livekitUrl }
    } catch (err: any) {
      return { token: 'mock-token', url: livekitUrl, error: err.message }
    }
  })
}
