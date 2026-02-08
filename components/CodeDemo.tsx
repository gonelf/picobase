'use client'

import { useState, useEffect } from 'react'

const CLI_LINES = [
  { text: 'Can you add authentication with PicoBase?', type: 'user' as const, delay: 0 },
  { text: '', type: 'space' as const, delay: 800 },
  { text: 'I\'ll add authentication with PicoBase for you. Let me install the client and set everything up.', type: 'assistant' as const, delay: 1000 },
  { text: '', type: 'space' as const, delay: 2000 },
  { text: '$ npm install @picobase_app/client', type: 'command' as const, delay: 2200 },
  { text: '', type: 'space' as const, delay: 2800 },
  { text: '✓ Created components/AuthForm.tsx', type: 'output' as const, delay: 3000 },
  { text: '✓ Added /login route', type: 'output' as const, delay: 3300 },
  { text: '✓ Added /register route', type: 'output' as const, delay: 3600 },
  { text: '✓ Configured authentication context', type: 'output' as const, delay: 3900 },
  { text: '', type: 'space' as const, delay: 4200 },
  { text: 'Done! /login and /register are ready to be tested. The auth form includes email/password and OAuth support.', type: 'assistant' as const, delay: 4400 },
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
    <div className="rounded-xl overflow-hidden border border-amber-400/30 bg-[#1a1a1a] shadow-2xl font-mono">
      {/* Claude Code Header */}
      <div className="px-4 py-3 border-b border-amber-400/30">
        <div className="flex items-center justify-between">
          <span className="text-amber-400 text-xs">Claude Code v2.1.37</span>
          <span className="text-gray-500 text-xs">~/picobase</span>
        </div>
      </div>

      {/* CLI conversation area */}
      <div className="p-5 text-sm leading-relaxed min-h-[320px]">
        {CLI_LINES.slice(0, visibleLines).map((line, i) => {
          if (line.type === 'space') {
            return <div key={i}>&nbsp;</div>
          }
          if (line.type === 'user') {
            return (
              <div key={i} className="mb-2">
                <span className="text-white/90">{line.text}</span>
                <span className="ml-2 inline-block w-2 h-4 bg-white/80 animate-pulse" />
              </div>
            )
          }
          if (line.type === 'assistant') {
            return <div key={i} className="text-blue-300/90 mb-2">{line.text}</div>
          }
          if (line.type === 'command') {
            return <div key={i} className="text-gray-400 mb-1">{line.text}</div>
          }
          if (line.type === 'output') {
            return (
              <div key={i} className="text-green-400/80 flex items-center gap-2 mb-1">
                <span>{line.text}</span>
              </div>
            )
          }
          return null
        })}
      </div>

      {/* Bottom prompt bar */}
      <div className="border-t border-amber-400/30 px-4 py-3 bg-[#141414]">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>▶</span>
          <span className="opacity-50">? for shortcuts</span>
        </div>
      </div>
    </div>
  )
}
