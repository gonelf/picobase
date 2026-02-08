'use client'

import { useState, useEffect } from 'react'

const CLI_LINES = [
  { text: '$ claude', type: 'prompt' as const, delay: 0 },
  { text: '', type: 'space' as const, delay: 200 },
  { text: 'You: Can you add authentication with PicoBase?', type: 'user' as const, delay: 400 },
  { text: '', type: 'space' as const, delay: 600 },
  { text: 'Claude: I\'ll add authentication with PicoBase for you.', type: 'assistant' as const, delay: 800 },
  { text: '', type: 'space' as const, delay: 1200 },
  { text: '$ npm install @picobase_app/client', type: 'command' as const, delay: 1400 },
  { text: '✓ Installed @picobase_app/client', type: 'success' as const, delay: 1800 },
  { text: '', type: 'space' as const, delay: 2000 },
  { text: '✓ Created components/AuthForm.tsx', type: 'success' as const, delay: 2200 },
  { text: '✓ Added /login and /register routes', type: 'success' as const, delay: 2500 },
  { text: '✓ Configured auth context', type: 'success' as const, delay: 2800 },
  { text: '', type: 'space' as const, delay: 3000 },
  { text: 'Claude: Done! /login and /register are ready to be tested.', type: 'assistant-done' as const, delay: 3200 },
]

export default function CodeDemo() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    CLI_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(i + 1)
      }, line.delay)
    })
  }, [])

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-gray-950 shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/80 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-white/40 text-xs font-mono">Claude Code CLI</span>
      </div>

      {/* CLI area */}
      <div className="p-5 font-mono text-sm leading-relaxed min-h-[320px]">
        {CLI_LINES.slice(0, visibleLines).map((line, i) => {
          if (line.type === 'space') {
            return <div key={i}>&nbsp;</div>
          }
          if (line.type === 'prompt') {
            return <div key={i} className="text-primary-400">{line.text}</div>
          }
          if (line.type === 'user') {
            return <div key={i} className="text-white">{line.text}</div>
          }
          if (line.type === 'assistant' || line.type === 'assistant-done') {
            return <div key={i} className="text-blue-300">{line.text}</div>
          }
          if (line.type === 'command') {
            return <div key={i} className="text-gray-400">{line.text}</div>
          }
          if (line.type === 'success') {
            return (
              <div key={i} className="text-green-400 flex items-center gap-2">
                <span>{line.text}</span>
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
