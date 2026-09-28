import { useEffect, useState } from 'react'
import { Glyph } from './ui.tsx'

type Phase = 'profiling' | 'rules' | 'scoring' | 'done'

const stages: { id: Phase; label: string }[] = [
  { id: 'profiling', label: 'Profiling columns' },
  { id: 'rules', label: 'Applying selected rules' },
  { id: 'scoring', label: 'Scoring the first run' },
]

export default function RunOverlay({
  tableName,
  ruleCount,
  onFinished,
}: {
  tableName: string
  ruleCount: number
  onFinished: () => void
}) {
  const [phase, setPhase] = useState<Phase>('profiling')

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase('rules'), 700),
      window.setTimeout(() => setPhase('scoring'), 1600),
      window.setTimeout(() => setPhase('done'), 2300),
      window.setTimeout(() => onFinished(), 3100),
    ]
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [onFinished])

  const currentIndex = phase === 'done' ? stages.length : stages.findIndex((item) => item.id === phase)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] p-4 backdrop-blur-[4px]">
      <div className="w-full max-w-md rounded-lg bg-ink px-8 py-10 text-white shadow-overlay">
        {phase === 'done' ? (
          <div className="flex flex-col items-center text-center">
            <span className="grid size-12 place-items-center rounded-full bg-success text-white">
              <Glyph size={22}>
                <path d="m7 12.5 3 3L17 9" />
              </Glyph>
            </span>
            <h2 className="mt-4 font-sans text-lg font-semibold tracking-[-0.02em]">Validation created</h2>
            <p className="mt-1 text-sm leading-6 text-white/70">{tableName} is ready. Opening notifications next.</p>
          </div>
        ) : (
          <div>
            <p className="font-label text-[11px] tracking-[0.16em] text-white/50 uppercase">Running</p>
            <h2 className="mt-2 font-sans text-lg font-semibold tracking-[-0.02em]">{tableName || 'Validation'}</h2>
            <p className="mt-1 text-sm text-white/70">
              {phase === 'rules' ? `Applying ${ruleCount} checks` : stages[currentIndex]?.label}
            </p>
            <ol className="mt-6 flex flex-col gap-3">
              {stages.map((stage, index) => {
                const done = index < currentIndex
                const current = index === currentIndex
                return (
                  <li key={stage.id} className="flex items-center gap-3">
                    <span
                      className={`grid size-6 place-items-center rounded-full border text-[11px] ${
                        done ? 'border-success bg-success text-white' : current ? 'border-stable text-stable' : 'border-white/20 text-white/30'
                      }`}
                    >
                      {done ? (
                        <Glyph size={12}>
                          <path d="m7 12.5 3 3L17 9" />
                        </Glyph>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className={`text-sm ${current ? 'text-white' : done ? 'text-white/80' : 'text-white/35'}`}>{stage.label}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
