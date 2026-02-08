'use client'

import { useState, useEffect } from 'react'

const CODE_LINES = [
  { text: '// 1. Define your data shape', type: 'comment' as const },
  { text: 'interface Todo {', type: 'code' as const },
  { text: '  id: string', type: 'code' as const },
  { text: '  title: string', type: 'code' as const },
  { text: '  done: boolean', type: 'code' as const },
  { text: '}', type: 'code' as const },
  { text: '', type: 'code' as const },
  { text: '// 2. Just write data. We handle the rest.', type: 'comment' as const },
  { text: 'const pb = createClient()', type: 'code' as const },
  { text: '', type: 'code' as const },
  { text: 'await pb.collection("todos").create({', type: 'code' as const },
  { text: '  title: "Ship my app",', type: 'code' as const },
  { text: '  done: false,', type: 'code' as const },
  { text: '})', type: 'code' as const },
]

const STATUS_LINES = [
  { text: 'Connected', delay: 800 },
  { text: 'Collection "todos" created automatically', delay: 1600 },
  { text: 'Record inserted', delay: 2200 },
]

export default function CodeDemo() {
  const [visibleLines, setVisibleLines] = useState(0)
  const [statusIndex, setStatusIndex] = useState(-1)

  useEffect(() => {
    // Type out code lines
    const lineTimer = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= CODE_LINES.length) {
          clearInterval(lineTimer)
          return prev
        }
        return prev + 1
      })
    }, 120)

    // Show status lines after code is "typed"
    STATUS_LINES.forEach((status, i) => {
      setTimeout(() => setStatusIndex(i), CODE_LINES.length * 120 + status.delay)
    })

    return () => clearInterval(lineTimer)
  }, [])

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-gray-950 shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/80 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-white/40 text-xs font-mono">app.ts</span>
      </div>

      {/* Code area */}
      <div className="p-5 font-mono text-sm leading-relaxed min-h-[320px]">
        {CODE_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={line.type === 'comment' ? 'text-gray-500' : 'text-gray-200'}>
            {line.text || '\u00A0'}
          </div>
        ))}

        {/* Status bar */}
        {statusIndex >= 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
            {STATUS_LINES.slice(0, statusIndex + 1).map((status, i) => (
              <div key={i} className="text-xs flex items-center gap-2">
                <span className="text-green-400">
                  {i === 0 ? '\u25CF' : '\u26A1'}
                </span>
                <span className="text-green-400/80">{status.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
