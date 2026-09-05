export const TITLE_EVENT = 'hive:title-chat'

export function isPlaceholderTitle(title: string) {
  const t = title.trim()
  if (!t) return true
  if (/^new chat$/i.test(t)) return true
  if (/chat\s+\d+$/i.test(t)) return true
  if (/^untitled/i.test(t)) return true
  return false
}

export function localTitle(text: string) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return 'New chat'
  const cut = t.length > 52 ? `${t.slice(0, 52).replace(/\s+\S*$/, '')}` : t
  return cut.charAt(0).toUpperCase() + cut.slice(1)
}

export function emitTitleChat(text: string) {
  window.dispatchEvent(new CustomEvent(TITLE_EVENT, { detail: text }))
}

export async function refineTitle(text: string): Promise<string | null> {
  try {
    const res = await window.electronAPI?.ai?.chat?.(
      [
        {
          role: 'system',
          content:
            'Name this chat thread. Reply with ONLY a title: 3 to 7 words, Title Case, no quotes, no emoji, no period.',
        },
        { role: 'user', content: text.slice(0, 480) },
      ],
      undefined,
      { webSearch: false }
    )
    if (!res?.ok || !res.content) return null
    let title = res.content.trim().split('\n')[0].replace(/^["'“”]+|["'“”]+$/g, '')
    title = title.replace(/[.?!]+$/g, '').trim()
    if (title.length < 3 || title.length > 64) return null
    if (/you are|as an ai|i cannot/i.test(title)) return null
    return title
  } catch {
    return null
  }
}
