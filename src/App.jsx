import { useState, useEffect } from 'react'
import './App.css'

const HOOK_TEMPLATES = [
  (n) => `I found a quantum trading bot that actually works. Day ${n}.`,
  (n) => `Day ${n} of running my quantum trading strategy. Here's the move.`,
  (n) => `Nobody my age does this. Day ${n} update.`,
]

const MOOD_REACTIONS = {
  hyped:     "And honestly? I called it.",
  skeptical: "I questioned it. But I trust the system.",
  surprised: "Even I didn't see this one coming — and I built the strategy.",
  confident: "Exactly what I expected.",
  nervous:   "High risk play. I took it anyway.",
}

const ACTION_EMOJI = { buy: '📈', sell: '📉', hold: '⏸️' }

function generateScript(entry, dayCount, hookIndex) {
  const hook   = HOOK_TEMPLATES[hookIndex % HOOK_TEMPLATES.length](dayCount)
  const reason = entry.botReasoning?.trim() || "The algo doesn't always explain itself. That's fine."
  const react  = entry.mood ? MOOD_REACTIONS[entry.mood] : "We'll see if I'm right."
  return [
    `HOOK: "${hook}"`,
    ``,
    `THE MOVE: "Bot said ${entry.action.toUpperCase()} on ${entry.asset}. I did it."`,
    ``,
    `WHY: "${reason}"`,
    ``,
    `[SHOW STATS SCREENSHOT]`,
    ``,
    `MY READ: "${react}"`,
    ``,
    `CTA: "Follow. This is just getting started."`,
  ].join('\n')
}

function generateCaption(entry, dayCount) {
  const emoji   = ACTION_EMOJI[entry.action] || '👀'
  const react   = entry.mood ? MOOD_REACTIONS[entry.mood] : "We'll see if I'm right."
  const tag     = entry.asset?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'trading'
  return [
    `Day ${dayCount}: ${entry.action.toUpperCase()} on ${entry.asset}. ${emoji}`,
    react,
    `Running a quantum trading bot as a game — not financial advice.`,
    `#quantumtrading #tradingbot #videogame #day${dayCount} #${tag}`,
  ].join('\n')
}

const blankForm = () => ({
  date:         new Date().toISOString().slice(0, 10),
  asset:        '',
  action:       'buy',
  botReasoning: '',
  mood:         '',
})

function loadEntries() {
  try { return JSON.parse(localStorage.getItem('qt-entries') || '[]') }
  catch { return [] }
}

export default function App() {
  const [entries,    setEntries]    = useState(loadEntries)
  const [form,       setForm]       = useState(blankForm)
  const [tab,        setTab]        = useState('form')
  const [output,     setOutput]     = useState(null)
  const [hookIndex,  setHookIndex]  = useState(0)
  const [copied,     setCopied]     = useState({})

  useEffect(() => {
    try { localStorage.setItem('qt-entries', JSON.stringify(entries)) }
    catch {}
  }, [entries])

  const dayCount = entries.length + 1

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.asset.trim()) return
    setOutput({
      script:  generateScript(form, dayCount, hookIndex),
      caption: generateCaption(form, dayCount),
      snap:    { ...form },
    })
    setHookIndex(i => (i + 1) % HOOK_TEMPLATES.length)
    setTab('output')
  }

  const saveEntry = () => {
    if (!output) return
    setEntries(prev => [{ ...output.snap, result: 'pending', id: Date.now() }, ...prev])
    setForm(blankForm())
    setOutput(null)
    setTab('history')
  }

  const updateResult = (id, result) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, result } : e))

  const copyText = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(c => ({ ...c, [key]: true }))
      setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 1500)
    } catch {}
  }

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const wins    = entries.filter(e => e.result === 'win').length
  const losses  = entries.filter(e => e.result === 'loss').length
  const pending = entries.length - wins - losses

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">QT</span>
        <h1 className="app-title">Quantum Bot</h1>
        <span className="app-day">DAY {dayCount}</span>
      </header>

      {/* ── TODAY (form) ── */}
      {tab === 'form' && (
        <main className="tab-content">
          <form onSubmit={handleSubmit} className="entry-form">
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date}
                onChange={e => field('date', e.target.value)} />
            </div>

            <div className="field">
              <label>Asset <span className="required">*</span></label>
              <input type="text" placeholder="BTC, TSLA, ETH, SPY…"
                value={form.asset}
                onChange={e => field('asset', e.target.value)}
                required autoCapitalize="characters" />
            </div>

            <div className="field">
              <label>Action</label>
              <div className="action-pills">
                {['buy', 'sell', 'hold'].map(a => (
                  <button type="button" key={a}
                    className={`pill${form.action === a ? ` pill--active pill--${a}` : ''}`}
                    onClick={() => field('action', a)}>
                    {ACTION_EMOJI[a]} {a.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>
                Bot's reasoning{' '}
                <span className="optional">(optional)</span>
              </label>
              <textarea rows={2} placeholder="Why did the bot pick this?"
                value={form.botReasoning}
                onChange={e => field('botReasoning', e.target.value)} />
            </div>

            <div className="field">
              <label>
                Your reaction{' '}
                <span className="optional">(optional)</span>
              </label>
              <select value={form.mood} onChange={e => field('mood', e.target.value)}>
                <option value="">— pick a vibe —</option>
                <option value="hyped">🔥 Hyped</option>
                <option value="skeptical">🤨 Skeptical</option>
                <option value="surprised">😮 Surprised</option>
                <option value="confident">😎 Confident</option>
                <option value="nervous">😬 Nervous</option>
              </select>
            </div>

            <button type="submit" className="btn-generate">
              Generate Script + Caption →
            </button>
          </form>
        </main>
      )}

      {/* ── SCRIPT + CAPTION (output) ── */}
      {tab === 'output' && (
        <main className="tab-content">
          {output ? (
            <>
              <div className="output-section">
                <div className="output-header">
                  <span className="output-label">Video Script</span>
                  <button
                    className={`btn-copy${copied.script ? ' copied' : ''}`}
                    onClick={() => copyText('script', output.script)}>
                    {copied.script ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="output-block">{output.script}</pre>
              </div>

              <div className="output-section">
                <div className="output-header">
                  <span className="output-label">Caption</span>
                  <button
                    className={`btn-copy${copied.caption ? ' copied' : ''}`}
                    onClick={() => copyText('caption', output.caption)}>
                    {copied.caption ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="output-block">{output.caption}</pre>
              </div>

              <div className="output-actions">
                <button className="btn-save" onClick={saveEntry}>
                  Save to Log
                </button>
                <button className="btn-back" onClick={() => setTab('form')}>
                  ← Edit
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No script yet — fill in today's pick first.</p>
              <button className="btn-back" onClick={() => setTab('form')}>
                ← Go to Form
              </button>
            </div>
          )}
        </main>
      )}

      {/* ── HISTORY (log) ── */}
      {tab === 'history' && (
        <main className="tab-content">
          {entries.length > 0 && (
            <div className="scoreboard">
              <div className="score score--win">
                <span>{wins}</span>wins
              </div>
              <div className="score-divider">/</div>
              <div className="score score--loss">
                <span>{losses}</span>losses
              </div>
              <div className="score-divider">/</div>
              <div className="score score--pending">
                <span>{pending}</span>pending
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <div className="empty-state">
              <p>No entries yet. Generate your first script and save it.</p>
            </div>
          ) : (
            <ul className="history-list">
              {entries.map((entry, i) => (
                <li key={entry.id} className={`history-item result--${entry.result}`}>
                  <div className="history-top">
                    <span className="history-day">Day {entries.length - i}</span>
                    <span className="history-date">{entry.date}</span>
                  </div>
                  <div className="history-pick">
                    <span className={`action-badge action--${entry.action}`}>
                      {ACTION_EMOJI[entry.action]} {entry.action.toUpperCase()}
                    </span>
                    <span className="history-asset">{entry.asset}</span>
                  </div>
                  <div className="history-result-row">
                    <label>Result</label>
                    <select
                      className={`result-select result--${entry.result}`}
                      value={entry.result}
                      onChange={e => updateResult(entry.id, e.target.value)}>
                      <option value="pending">⏳ Pending</option>
                      <option value="win">✅ Win</option>
                      <option value="loss">❌ Loss</option>
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}

      <nav className="bottom-nav">
        {[
          { id: 'form',    icon: '✏️',  label: 'Today'  },
          { id: 'output',  icon: '📋',  label: 'Script' },
          { id: 'history', icon: '📊',  label: 'Log'    },
        ].map(({ id, icon, label }) => (
          <button key={id}
            className={`nav-item${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
