const TRIVIAL =
  /^(hey+|hi+|hello+|yo+|sup+|hola+|ok+|okay+|k+|thanks+|thank you+|ty+|np+|yes+|no+|yep+|nope+|gm+|gn+|good morning|good night|whats? up\??|how's it going\??|wyd\??|bro+|dude+)\s*[!?.]*$/i

export function isTrivialChat(text: string) {
  const t = String(text || '').trim()
  if (!t) return true
  if (t.length > 48) return false
  if (/https?:\/\//i.test(t)) return false
  if (/\b(search|find|code|build|fix|write|open|run|research|plan|debug)\b/i.test(t)) return false
  if (TRIVIAL.test(t)) return true
  const words = t.split(/\s+/).filter(Boolean)
  return words.length <= 3 && t.length <= 24 && !/[?]{2,}|why|how|what|when|where|who/i.test(t)
}

export function wantsSwarm(text: string) {
  if (isTrivialChat(text)) return false
  const t = String(text || '')
  if (t.length >= 80) return true
  return /\b(search|research|plan|compare|debug|refactor|swarm|team|review|cite|sources)\b/i.test(t)
}
