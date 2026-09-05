import { ipcMain } from 'electron'
import https from 'https'
import fs from 'fs'
import { synthesizeMicrosoftVoice } from './tts-service'

const DEFAULT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
let botToken: string = DEFAULT_TOKEN
let lastUpdateId = 0
let pollingActive = false
let activeChatId = '8551349623'
let currentAuthPin = '849201' // 6-digit pin generated in desktop app
const authorizedChatIds = new Set<string>()

export function setTelegramAuthPin(pin: string) {
  currentAuthPin = pin
  return currentAuthPin
}

export function getTelegramAuthPin() {
  return currentAuthPin
}

// Real-time call transcript buffer
let phoneCallTranscript: { role: 'user' | 'assistant'; content: string; timestamp: number }[] = []

// Persistent conversation history with the user on Telegram
let telegramConversationHistory: { role: 'user' | 'assistant'; content: string }[] = []

function apiUrl(method: string) {
  return `https://api.telegram.org/bot${botToken}/${method}`
}

async function tgFetch(method: string, params: Record<string, any> = {}) {
  const isGet = ['getMe', 'getChat'].includes(method)
  try {
    const res = await fetch(apiUrl(method), {
      method: isGet ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: isGet ? undefined : JSON.stringify(params),
    })
    return await res.json()
  } catch (e: any) {
    return { ok: false, description: e.message }
  }
}

export async function sendTelegramTextMessage(chatId: string, text: string) {
  const cId = chatId || activeChatId
  return tgFetch('sendMessage', {
    chat_id: cId,
    text,
  })
}

// Multipart Voice Note with natural Microsoft neural voice
export async function sendTelegramVoiceNote(chatId: string, text: string): Promise<any> {
  const cId = chatId || activeChatId
  if (!cId) return { ok: false, error: 'No chatId' }

  try {
    const audioPath = await synthesizeMicrosoftVoice(text)
    const fileData = fs.readFileSync(audioPath)
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2)

    const postDataStart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
      `${cId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="caption"\r\n\r\n` +
      `🎙 Hive\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="voice"; filename="voice.ogg"\r\n` +
      `Content-Type: audio/ogg\r\n\r\n`
    )

    const postDataEnd = Buffer.from(`\r\n--${boundary}--\r\n`)
    const fullBody = Buffer.concat([postDataStart, fileData, postDataEnd])

    phoneCallTranscript.push({
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
    })

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.telegram.org',
        path: `/bot${botToken}/sendVoice`,
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': fullBody.length,
        },
      }, (res) => {
        let resp = ''
        res.on('data', d => resp += d)
        res.on('end', () => {
          try { fs.unlinkSync(audioPath) } catch {}
          try { resolve(JSON.parse(resp)) } catch { resolve({ ok: true, raw: resp }) }
        })
      })

      req.on('error', (err) => {
        try { fs.unlinkSync(audioPath) } catch {}
        resolve({ ok: false, error: err.message })
      })

      req.write(fullBody)
      req.end()
    })
  } catch (err: any) {
    return tgFetch('sendMessage', { chat_id: cId, text })
  }
}

// Grok-style witty, concise, zero-slop Telegram Assistant Poller
function startTelegramPoller() {
  if (pollingActive) return
  pollingActive = true

  const poll = async () => {
    try {
      const res: any = await tgFetch('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 10,
        allowed_updates: ['message', 'callback_query'],
      })

      if (res?.ok && Array.isArray(res.result) && res.result.length > 0) {
        console.log(`[Telegram] Received ${res.result.length} update(s)`)
        for (const u of res.result) {
          lastUpdateId = Math.max(lastUpdateId, u.update_id)

          if (u.message && u.message.text) {
            const cId = String(u.message.chat?.id || '')
            if (cId) activeChatId = cId
            const userText = u.message.text.trim()
            console.log(`[Telegram] Message from ${cId}: "${userText}"`)

            // 1. PIN Authentication Check
            if (!authorizedChatIds.has(cId)) {
              if (userText === currentAuthPin || userText === `/auth ${currentAuthPin}`) {
                authorizedChatIds.add(cId)
                console.log(`[Telegram] Authorized chat: ${cId}`)
                await tgFetch('sendMessage', {
                  chat_id: cId,
                  text: `🔓 Device Authorized! Welcome to Hive.\n\nYou are now paired directly with your desktop assistant. Send any question, command, or task!`,
                })
                continue
              } else {
                console.log(`[Telegram] Sent auth challenge to: ${cId}`)
                await tgFetch('sendMessage', {
                  chat_id: cId,
                  text: `⚡ Hive Desktop Connection\n\n🔒 To pair this Telegram chat with your Hive workspace, please enter the 6-digit PIN token shown in your Hive Desktop app (Settings → Integrations & Auth).\n\n👉 Current PIN: [ Enter 6 Digits ]\nExample: ${currentAuthPin}`,
                })
                continue
              }
            }

            // 2. Show typing action on Telegram
            await tgFetch('sendChatAction', {
              chat_id: cId,
              action: 'typing',
            })

            telegramConversationHistory.push({
              role: 'user',
              content: userText,
            })
            if (telegramConversationHistory.length > 8) {
              telegramConversationHistory = telegramConversationHistory.slice(-8)
            }

            try {
              const { ingestUserMessage } = require('./mozaik/ingest') as typeof import('./mozaik/ingest')
              ingestUserMessage(userText, {
                conversationId: `tg-${cId}`,
                via: 'telegram',
                telegramChatId: cId,
              })
            } catch (err: any) {
              await tgFetch('sendMessage', {
                chat_id: cId,
                text: err?.message || 'Hive swarm is offline.',
              })
            }
          }
        }
      }
    } catch {}
    setTimeout(poll, 1000)
  }

  poll()
}

export function registerTelegramHandlers() {
  startTelegramPoller()

  ipcMain.handle('telegram:getMe', () => tgFetch('getMe'))

  ipcMain.handle('telegram:getActiveChatId', () => activeChatId)

  ipcMain.handle('telegram:getAuthPin', () => currentAuthPin)

  ipcMain.handle('telegram:generateAuthPin', () => {
    currentAuthPin = Math.floor(100000 + Math.random() * 900000).toString()
    return currentAuthPin
  })

  ipcMain.handle('telegram:getCallTranscript', () => phoneCallTranscript)
  
  ipcMain.handle('telegram:clearCallTranscript', () => {
    phoneCallTranscript = []
    return true
  })

  ipcMain.handle('telegram:sendMessage', async (_e, chatId: string, text: string) => {
    const cId = chatId || activeChatId
    if (!cId || !text) return { ok: false, description: 'chatId and text required' }
    return tgFetch('sendMessage', { chat_id: cId, text })
  })

  ipcMain.handle('telegram:sendVoice', async (_e, chatId: string, text: string) => {
    const cId = chatId || activeChatId
    return await sendTelegramVoiceNote(cId, text)
  })

  ipcMain.handle('telegram:notifyDone', async (_e, chatId: string, summary: string) => {
    const cId = chatId || activeChatId
    return tgFetch('sendMessage', {
      chat_id: cId,
      text: `✅ Done: ${summary}`,
    })
  })

  ipcMain.handle('tts:speak', async (_e, text: string) => {
    try {
      const audioPath = await synthesizeMicrosoftVoice(text)
      const dataUrl = `data:audio/mp3;base64,${fs.readFileSync(audioPath).toString('base64')}`
      try { fs.unlinkSync(audioPath) } catch {}
      return { ok: true, dataUrl }
    } catch (e: any) {
      return { ok: false, error: e.message }
    }
  })
}
