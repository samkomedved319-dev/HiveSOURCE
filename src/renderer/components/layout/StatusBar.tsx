import { useEffect, useState } from 'react'

export default function StatusBar() {
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 30000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="h-6 flex items-center justify-between px-3 bg-[#09090b] border-t border-zinc-800/60 text-[10px] text-zinc-500 shrink-0">
      <span>Hive v1.0</span>
      <span className="font-mono">{time}</span>
    </div>
  )
}
