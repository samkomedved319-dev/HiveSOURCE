import { useState, useEffect } from 'react'
import { Plus, Trash2, Send, Phone, Check, AlertCircle, Radio } from 'lucide-react'
import { useAgentStore } from '../../stores/agentStore'

export default function Sidebar() {
  const { agents, activeAgent, setActiveAgent, addAgent, removeAgent } = useAgentStore()
  const [tgChatId, setTgChatId] = useState('')
  const [tgMsg, setTgMsg] = useState('Hello from Hive!')
  const [tgStatus, setTgStatus] = useState('')
  const [tgOk, setTgOk] = useState(false)
  const [tgLoading, setTgLoading] = useState(false)
  const [botInfo, setBotInfo] = useState<any>(null)

  useEffect(() => { window.electronAPI?.telegram?.getMe?.().then(setBotInfo).catch(() => {}) }, [])

  const handleNewAgent = () => {
    const p = ['creative', 'coder', 'researcher', 'analyst'][Math.floor(Math.random() * 4)]
    const n = `Agent ${agents.length + 1}`
    addAgent({ id: `a-${Date.now()}`, name: n, systemPrompt: `You are ${n}, a ${p} assistant. Be concise and helpful.` })
  }

  const tgSend = async (type: 'message' | 'call') => {
    if (!tgChatId.trim()) { setTgStatus('Enter chat ID'); setTgOk(false); return }
    setTgLoading(true)
    try {
      const fn = type === 'call' ? window.electronAPI.telegram.sendVoice : window.electronAPI.telegram.sendMessage
      const res: any = await fn(tgChatId.trim(), tgMsg.trim() || 'Hello from Hive!')
      setTgStatus(res?.ok ? (type === 'call' ? 'Call sent' : 'Sent') : (res?.description || 'Failed'))
      setTgOk(!!res?.ok)
    } catch (e: any) { setTgStatus(e.message); setTgOk(false) }
    setTgLoading(false)
    setTimeout(() => setTgStatus(''), 4000)
  }

  const botName = botInfo?.result?.username ? `@${botInfo.result.username}` : '...'
  const online = botInfo?.ok === true

  return (
    <aside className="w-72 h-full border-r border-zinc-800/60 flex flex-col shrink-0 bg-zinc-900/30">
      <div className="p-3 border-b border-zinc-800/60">
        <button
          onClick={handleNewAgent}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Agents</div>
        {agents.map((agent) => (
          <div key={agent.id} className="group relative">
            <button
              onClick={() => setActiveAgent(agent)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${activeAgent?.id === agent.id ? 'bg-zinc-800/80 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}
            >
              <div className="w-7 h-7 rounded-full bg-violet-600/15 border border-violet-500/20 grid place-items-center text-[10px] font-bold text-violet-400">
                {agent.name.charAt(0)}
              </div>
              <span className="text-sm truncate">{agent.name}</span>
            </button>
            {agents.length > 1 && (
              <button
                onClick={() => removeAgent(agent.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:grid w-6 h-6 place-items-center rounded hover:bg-zinc-700 text-zinc-600 hover:text-zinc-300"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        <div className="pt-3 mt-2 border-t border-zinc-800/60 px-1 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-medium text-zinc-300">Telegram</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
              {online ? botName : '...'}
            </div>
          </div>

          <input
            value={tgChatId}
            onChange={(e) => setTgChatId(e.target.value)}
            placeholder="Chat ID (user must /start bot)"
            className="w-full px-2.5 py-2 rounded-lg bg-zinc-950/50 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
          <textarea
            value={tgMsg}
            onChange={(e) => setTgMsg(e.target.value)}
            rows={2}
            placeholder="Message..."
            className="w-full px-2.5 py-2 rounded-lg bg-zinc-950/50 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 resize-none transition-colors"
          />

          <div className="flex gap-1.5">
            <button
              onClick={() => tgSend('message')}
              disabled={tgLoading || !tgChatId.trim()}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 disabled:opacity-30 transition-colors"
            >
              <Send className="w-3 h-3" /> Send
            </button>
            <button
              onClick={() => tgSend('call')}
              disabled={tgLoading || !tgChatId.trim()}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs text-white disabled:opacity-30 transition-colors"
            >
              <Phone className="w-3 h-3" /> Call
            </button>
          </div>

          {tgStatus && (
            <div className={`text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${tgOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {tgOk ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {tgStatus}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}