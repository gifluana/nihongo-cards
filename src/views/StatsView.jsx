// StatsView.jsx — Progress and statistics

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_LEVEL     = 7
const CIRCUMFERENCE = 2 * Math.PI * 45

export default function StatsView({ active, store, allCards, updateStore, showToast, onResetProgress }) {
  const { t } = useTranslation()
  const ringRef = useRef(null)
  const [confirming, setConfirming] = useState(false)

  function handleReset() {
    if (!confirming) {
      setConfirming(true)
      // Auto-cancel confirm state after 3s
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    updateStore(s => ({
      ...s,
      srData:         {},
      totalCorrect:   0,
      totalIncorrect: 0,
      todayStudied:   0,
      streak:         0,
      lastStudyDate:  '',
    }))
    setConfirming(false)
    showToast('✓ Progress reset')
    onResetProgress()
  }

  const total  = allCards.length
  let mastered = 0, learning = 0, newCards = 0

  allCards.forEach(c => {
    const sr = store.srData[c.id]
    if (!sr || sr.level === 0)      newCards++
    else if (sr.level >= MAX_LEVEL) mastered++
    else                            learning++
  })

  const masteredPct  = total ? Math.round(mastered / total * 100) : 0
  const totalReviews = store.totalCorrect + store.totalIncorrect
  const accuracy     = totalReviews ? Math.round(store.totalCorrect / totalReviews * 100) : 0
  const ringOffset   = CIRCUMFERENCE - (masteredPct / 100) * CIRCUMFERENCE

  useEffect(() => {
    if (!active || !ringRef.current) return
    ringRef.current.style.strokeDashoffset = CIRCUMFERENCE
    const timer = setTimeout(() => {
      if (ringRef.current) ringRef.current.style.strokeDashoffset = ringOffset
    }, 120)
    return () => clearTimeout(timer)
  }, [active, ringOffset])

  const typeStats = [
    { id: 'hiragana', label: 'Hiragana',      color: '#6366f1', cards: allCards.filter(c => c.type === 'hiragana') },
    { id: 'katakana', label: 'Katakana',       color: '#a855f7', cards: allCards.filter(c => c.type === 'katakana') },
    { id: 'vocab',    label: t('vocab_label'), color: '#e11d48', cards: allCards.filter(c => c.type === 'vocab' || c.type === 'custom') },
  ].map(row => {
    const done = row.cards.filter(c => (store.srData[c.id]?.level ?? 0) >= MAX_LEVEL).length
    const pct  = row.cards.length ? Math.round(done / row.cards.length * 100) : 0
    return { ...row, done, pct }
  })

  const legendItems = [
    { color: '#e11d48', shadow: 'rgba(225,29,72,0.6)',  label: t('mastered'),  count: mastered  },
    { color: '#7c3aed', shadow: 'rgba(124,58,237,0.6)', label: t('learning'),  count: learning  },
    { color: 'rgba(255,255,255,0.18)', shadow: null,    label: t('new_cards'), count: newCards  },
  ]

  return (
    <div className={`view ${active ? 'active' : ''}`}>
      <div className="stats-scroll">

        <div className="stats-header">
          <h2>{t('stats_title')}</h2>
          <p>{t('stats_sub')}</p>
        </div>

        {/* Mastery ring */}
        <div className="glass" style={{ padding: 0 }}>
          <div className="ring-section">
            <div className="ring-wrap">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#e11d48" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
                <circle className="ring-bg"   cx="55" cy="55" r="45" />
                <circle
                  ref={ringRef}
                  className="ring-fill"
                  cx="55" cy="55" r="45"
                  stroke="url(#ringGrad)"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE}
                />
              </svg>
              <div className="ring-label">
                <div className="ring-pct">{masteredPct}%</div>
                <div className="ring-sub">Mastery</div>
              </div>
            </div>

            <div className="ring-legend">
              {legendItems.map(item => (
                <div key={item.label} className="legend-item">
                  <div
                    className="legend-dot"
                    style={{
                      background: item.color,
                      boxShadow: item.shadow ? `0 0 6px ${item.shadow}` : 'none',
                    }}
                  />
                  <div>
                    <div className="legend-name">{item.label}</div>
                    <div className="legend-count">{item.count} cards</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="stats-grid">
          <div className="glass stat-tile accent">
            <div className="stat-num">{store.todayStudied}</div>
            <div className="stat-lbl">{t('today')}</div>
          </div>
          <div className="glass stat-tile">
            <div className="stat-num">{store.streak} 🔥</div>
            <div className="stat-lbl">{t('streak')}</div>
          </div>
          <div className="glass stat-tile green">
            <div className="stat-num">{totalReviews ? `${accuracy}%` : '—'}</div>
            <div className="stat-lbl">{t('accuracy')}</div>
          </div>
          <div className="glass stat-tile">
            <div className="stat-num">{total}</div>
            <div className="stat-lbl">{t('total_cards')}</div>
          </div>
        </div>

        {/* Type breakdown */}
        <div className="glass type-breakdown">
          <h3>{t('by_type')}</h3>
          {typeStats.map(row => (
            <div key={row.id} className="type-row">
              <span className="type-label" style={{ color: row.color }}>{row.label}</span>
              <div className="type-bar-track">
                <div
                  className="type-bar"
                  style={{
                    background: row.color,
                    width: active ? `${row.pct}%` : '0%',
                    transition: active ? 'width 1s ease 0.2s' : 'none',
                  }}
                />
              </div>
              <span className="type-count">{row.done}/{row.cards.length}</span>
            </div>
          ))}
        </div>

        {/* Reset progress */}
        <div className="glass" style={{ padding: '16px 20px', textAlign: 'center' }}>
          <button
            className={`reset-btn ${confirming ? 'reset-btn-confirm' : ''}`}
            onClick={handleReset}
          >
            {confirming ? '⚠ Tap again to confirm reset' : '🗑 Reset all progress'}
          </button>
          {confirming && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
              This will erase all SR data and stats. Custom cards are kept.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}