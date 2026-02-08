'use client'

import { useState, useEffect } from 'react'

const CONVERSATION_LINES = [
  { text: 'Can you add authentication with PicoBase?', type: 'user' as const, delay: 0 },
  { text: '', type: 'space' as const, delay: 500 },
  { text: 'I\'ll add authentication with PicoBase for you. Let me install the client and set everything up.', type: 'assistant' as const, delay: 700 },
  { text: '', type: 'space' as const, delay: 1500 },
  { text: '$ npm install @picobase_app/client', type: 'command' as const, delay: 1700 },
  { text: '', type: 'space' as const, delay: 2200 },
  { text: '✓ Created components/AuthForm.tsx', type: 'success' as const, delay: 2400 },
  { text: '✓ Added /login route', type: 'success' as const, delay: 2700 },
  { text: '✓ Added /register route', type: 'success' as const, delay: 3000 },
  { text: '✓ Configured authentication context', type: 'success' as const, delay: 3300 },
  { text: '', type: 'space' as const, delay: 3600 },
  { text: 'Done! /login and /register are ready to be tested.', type: 'assistant' as const, delay: 3800 },
]

export default function CodeDemo() {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showConversation, setShowConversation] = useState(false)

  useEffect(() => {
    // Show welcome screen first, then switch to conversation
    const timer = setTimeout(() => {
      setShowConversation(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (showConversation) {
      CONVERSATION_LINES.forEach((line, i) => {
        setTimeout(() => {
          setVisibleLines(i + 1)
        }, line.delay)
      })
    }
  }, [showConversation])

  if (!showConversation) {
    // Welcome screen that looks like real Claude Code
    return (
      <div className="bg-[#1a1a1a] text-[#d4d4d4] font-mono text-[13px] leading-relaxed p-4 rounded-xl shadow-2xl">
        {/* Top border with title */}
        <div className="text-amber-400/80">
          <span>╭─── Claude Code v2.1.37 ───────────────────────────────────────╮</span>
        </div>

        {/* Main content area */}
        <div className="flex">
          {/* Left side - Welcome */}
          <div className="flex-1">
            <div className="text-amber-400/80">│</div>
            <div className="text-amber-400/80">│<span className="text-white ml-16">Welcome back!</span></div>
            <div className="text-amber-400/80">│</div>
            <div className="text-amber-400/80">│</div>
            {/* Pixel art character */}
            <div className="text-amber-400/80">│<span className="ml-20 text-[#e89393]">▗▖ ▗▖</span></div>
            <div className="text-amber-400/80">│<span className="ml-20 text-[#e89393]">████</span></div>
            <div className="text-amber-400/80">│<span className="ml-20 text-[#e89393]"> ▘▘ ▝▝</span></div>
            <div className="text-amber-400/80">│<span className="text-white/70 ml-6">Opus 4.6 · Claude Pro · user@example.com</span></div>
            <div className="text-amber-400/80">│<span className="text-white/50 ml-12">~/picobase</span></div>
          </div>

          {/* Right side - Tips */}
          <div className="text-amber-400/80 border-l border-amber-400/80">
            <div>│ <span className="text-amber-500/70">Tips for getting started</span><span className="ml-8">│</span></div>
            <div>│ <span className="text-white/50">Run /init to create CLAUDE.md</span><span className="ml-4">│</span></div>
            <div>│ <span className="text-amber-400/50">─────────────────────────────</span> │</div>
            <div>│ <span className="text-amber-500/70">Recent activity</span><span className="ml-16">│</span></div>
            <div>│ <span className="text-white/40">No recent activity</span><span className="ml-12">│</span></div>
            <div>│<span className="ml-36">│</span></div>
            <div>│<span className="ml-36">│</span></div>
            <div>│<span className="ml-36">│</span></div>
            <div>│<span className="ml-36">│</span></div>
          </div>
        </div>

        {/* Bottom border */}
        <div className="text-amber-400/80">
          <span>╰───────────────────────────────────────────────────────────────╯</span>
        </div>

        {/* Separator */}
        <div className="text-amber-400/50 my-2">
          ────────────────────────────────────────────────────────────────
        </div>

        {/* Prompt */}
        <div className="text-white/90">
          ❯ <span className="text-white/60">Can you add authentication with PicoBase?</span>
        </div>

        {/* Separator */}
        <div className="text-amber-400/50 my-2">
          ────────────────────────────────────────────────────────────────
        </div>

        {/* Bottom hint */}
        <div className="text-white/40 text-xs mt-2">
          ? for shortcuts
        </div>
      </div>
    )
  }

  // Conversation view
  return (
    <div className="bg-[#1a1a1a] text-[#d4d4d4] font-mono text-[13px] leading-relaxed p-4 rounded-xl shadow-2xl min-h-[400px]">
      <div className="space-y-2">
        {CONVERSATION_LINES.slice(0, visibleLines).map((line, i) => {
          if (line.type === 'space') {
            return <div key={i}>&nbsp;</div>
          }
          if (line.type === 'user') {
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-white/90">❯</span>
                <span className="text-white/90">{line.text}</span>
              </div>
            )
          }
          if (line.type === 'assistant') {
            return <div key={i} className="text-blue-300/90 ml-2">{line.text}</div>
          }
          if (line.type === 'command') {
            return <div key={i} className="text-gray-400 ml-2">{line.text}</div>
          }
          if (line.type === 'success') {
            return (
              <div key={i} className="text-green-400/80 ml-2">
                {line.text}
              </div>
            )
          }
          return null
        })}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 text-white/40 text-xs">
        ? for shortcuts
      </div>
    </div>
  )
}
