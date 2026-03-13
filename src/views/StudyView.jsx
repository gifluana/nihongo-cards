// StudyView.jsx — Study session with spaced repetition

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { playSound, speakJapanese } from '../utils/sounds'

const SR_INTERVALS = [
  0, 60_000, 600_000, 3_600_000,
  28_800_000, 86_400_000, 259_200_000, 604_800_000,
]
const MAX_LEVEL    = 7
const SESSION_SIZE = 20

function buildQueue(allCards, srData, filter, source) {
  const now  = Date.now()

  // 1. Filter by source
  let cards
  if      (source === 'default') cards = allCards.filter(c => !c.id.startsWith('c_'))
  else if (source === 'custom')  cards = allCards.filter(c =>  c.id.startsWith('c_'))
  else                           cards = allCards

  // 2. Filter by category
  if (filter !== 'all') cards = cards.filter(c => c.type === filter)

  const due = cards.filter(c => {
    const sr = srData[c.id]
    if (!sr) return true
    if (sr.level >= MAX_LEVEL) return false
    return sr.nextReview <= now
  })

  due.sort((a, b) => {
    const la = srData[a.id]?.level ?? -1
    const lb = srData[b.id]?.level ?? -1
    return la - lb
  })

  return due.slice(0, SESSION_SIZE).map(card => ({
    card,
    direction: Math.random() < 0.5 ? 'jp2pt' : 'pt2jp',
  }))
}

// Returns the localized translation for a vocab card
function getTranslation(card, lang) {
  if (lang === 'pt') return card.portuguese || card.english || ''
  return card.english || card.portuguese || ''
}

function cardContent(card, direction, lang) {
  const isKana = card.type === 'hiragana' || card.type === 'katakana'
  const translation = getTranslation(card, lang)
  if (direction === 'jp2pt') {
    return {
      front:       card.japanese,
      frontClass:  isKana ? 'kana' : 'word',
      back:        isKana ? card.romaji : translation,
      backClass:   isKana ? 'romaji' : 'port',
      backReading: isKana ? '' : (card.reading || ''),
    }
  } else {
    return {
      front:       isKana ? card.romaji : translation,
      frontClass:  isKana ? 'romaji' : 'port',
      back:        card.japanese,
      backClass:   isKana ? 'kana' : 'word',
      backReading: card.reading || '',
    }
  }
}

function typeName(t) {
  return { hiragana: 'Hiragana', katakana: 'Katakana', vocab: 'Vocab', custom: 'Custom' }[t] || t
}

export default function StudyView({ active, store, allCards, updateStore, showToast, sessionKey }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const [queue,        setQueue]        = useState([])
  const [idx,          setIdx]          = useState(0)
  const [flipped,      setFlipped]      = useState(false)
  const [showAnswers,  setShowAnswers]  = useState(false)
  const [phase,        setPhase]        = useState('studying')
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 })

  // Refs so effects always read the latest values without going stale
  const storeRef    = useRef(store)
  const allCardsRef = useRef(allCards)
  const phaseRef    = useRef('studying')
  const queueRef    = useRef([])
  const initializedRef = useRef(false)

  useEffect(() => { storeRef.current    = store    }, [store])
  useEffect(() => { allCardsRef.current = allCards }, [allCards])

  function setPhaseSync(p) {
    phaseRef.current = p
    setPhase(p)
  }

  function startNewSession() {
    const s = storeRef.current
    const q = buildQueue(allCardsRef.current, s.srData, s.studyFilter, s.cardSource)
    queueRef.current = q
    setQueue(q)
    setIdx(0)
    setFlipped(false)
    setShowAnswers(false)
    setSessionStats({ correct: 0, incorrect: 0 })
    setPhaseSync(q.length === 0 ? 'empty' : 'studying')
  }

  // Tab switch — preserve session if mid-session
  const wasActiveRef = useRef(false)
  useEffect(() => {
    if (active && !wasActiveRef.current) {
      if (!initializedRef.current || phaseRef.current === 'complete') {
        startNewSession()
        initializedRef.current = true
      }
      // Mid-session tab switch → do nothing, preserve queue/idx
    }
    wasActiveRef.current = active
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Filter chip changed — only rebuild if NOT mid-session
  // Category filter changed — always restart
  const prevFilterRef = useRef(store.studyFilter)
  useEffect(() => {
    if (store.studyFilter !== prevFilterRef.current) {
      prevFilterRef.current = store.studyFilter
      startNewSession()
      initializedRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.studyFilter])

  // Card source (Default / My Cards / All) changed — always restart
  const prevSourceRef = useRef(store.cardSource)
  useEffect(() => {
    if (store.cardSource !== prevSourceRef.current) {
      prevSourceRef.current = store.cardSource
      startNewSession()
      initializedRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.cardSource])

  // Stats reset — always force a fresh session
  const prevSessionKeyRef = useRef(sessionKey)
  useEffect(() => {
    if (sessionKey !== prevSessionKeyRef.current) {
      prevSessionKeyRef.current = sessionKey
      startNewSession()
      initializedRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey])

  function handleFlip() {
    if (flipped || phase !== 'studying' || queue.length === 0) return
    setFlipped(true)
    playSound('flip')
    const { card } = queue[idx]
    setTimeout(() => speakJapanese(card.japanese), 420)
    setTimeout(() => setShowAnswers(true), 340)
  }

  function handleAnswer(correct) {
    if (!flipped) return
    const { card } = queue[idx]
    const prev = storeRef.current.srData[card.id] ?? { level: 0, correct: 0, incorrect: 0 }
    const newLevel = correct
      ? Math.min(prev.level + 1, MAX_LEVEL)
      : Math.max(prev.level - 2, 0)

    updateStore(s => ({
      ...s,
      srData: {
        ...s.srData,
        [card.id]: {
          level:      newLevel,
          nextReview: Date.now() + SR_INTERVALS[newLevel],
          correct:    prev.correct   + (correct ? 1 : 0),
          incorrect:  prev.incorrect + (correct ? 0 : 1),
        },
      },
      totalCorrect:   s.totalCorrect   + (correct ? 1 : 0),
      totalIncorrect: s.totalIncorrect + (correct ? 0 : 1),
      todayStudied:   s.todayStudied   + 1,
    }))

    playSound(correct ? 'correct' : 'incorrect')

    const newStats = {
      correct:   sessionStats.correct   + (correct ? 1 : 0),
      incorrect: sessionStats.incorrect + (correct ? 0 : 1),
    }
    setSessionStats(newStats)

    const nextIdx = idx + 1
    if (nextIdx >= queue.length) {
      setShowAnswers(false)
      setPhaseSync('complete')
      setTimeout(() => playSound('complete'), 50)
    } else {
      setShowAnswers(false)
      setFlipped(false)
      setIdx(nextIdx)
    }
  }

  function handleSpeak(e) {
    e.stopPropagation()
    if (queue[idx]) speakJapanese(queue[idx].card.japanese)
  }

  const currentItem = queue[idx]
  const content  = currentItem ? cardContent(currentItem.card, currentItem.direction, lang) : null
  const srLevel  = currentItem ? (store.srData[currentItem.card.id]?.level ?? 0) : 0
  const progress = queue.length > 0 ? Math.round(idx / queue.length * 100) : 0
  const badgeClass = currentItem
    ? `badge-${currentItem.card.type === 'custom' ? 'custom' : currentItem.card.type}`
    : ''

  const filterChips = [
    { id: 'all',      label: t('filter_all')      },
    { id: 'hiragana', label: t('filter_hiragana') },
    { id: 'katakana', label: t('filter_katakana') },
    { id: 'vocab',    label: t('filter_vocab')    },
  ]

  const sourceOptions = [
    { id: 'default', label: t('source_default') },
    { id: 'custom',  label: t('source_custom')  },
    { id: 'all',     label: t('source_all')     },
  ]

  return (
    <div className={`view study-view ${active ? 'active' : ''}`}>

      {/* Source switch */}
      <div className="source-switch">
        {sourceOptions.map(opt => (
          <button
            key={opt.id}
            className={`source-option ${store.cardSource === opt.id ? 'active' : ''}`}
            onClick={() => { updateStore({ cardSource: opt.id }); playSound('tap') }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category filter chips */}
      <div className="filter-chips">
        {filterChips.map(chip => (
          <button
            key={chip.id}
            className={`filter-chip ${store.studyFilter === chip.id ? 'active' : ''}`}
            onClick={() => { updateStore({ studyFilter: chip.id }); playSound('tap') }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="session-bar">
        <div className="session-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="session-count">
          {queue.length > 0 ? `${Math.min(idx + 1, queue.length)} / ${queue.length}` : '0 / 0'}
        </div>
      </div>

      {/* Card area */}
      {phase === 'studying' && currentItem && (
        <div className="card-area">

          <div className="sr-level">
            {'⭐'.repeat(Math.min(srLevel, 5)) || t('card_new')}
          </div>

          <div
            key={`${currentItem.card.id}-${currentItem.direction}`}
            className="card-scene"
            onClick={handleFlip}
          >
            <div className={`card-inner ${flipped ? 'flipped' : ''}`}>

              {/* Front */}
              <div className="card-face card-front">
                <div className={`card-type-badge ${badgeClass}`}>
                  {typeName(currentItem.card.type)}
                </div>
                <div className="card-dir">
                  {currentItem.direction === 'jp2pt' ? t('card_dir_jp') : t('card_dir_pt')}
                </div>
                <div className={`card-main ${content.frontClass}`}>
                  {content.front}
                </div>
                <div className="card-hint">{t('card_hint')}</div>
              </div>

              {/* Back */}
              <div className="card-face card-back">
                <div className={`card-type-badge ${badgeClass}`}>
                  {typeName(currentItem.card.type)}
                </div>
                <div className={`card-main ${content.backClass}`}>
                  {content.back}
                </div>
                {content.backReading && (
                  <div className="card-reading">{content.backReading}</div>
                )}
                <button className="tts-btn" onClick={handleSpeak} title="🔊">
                  🔊
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Empty state */}
      {phase === 'empty' && (
        <div className="state-card">
          <div className="state-icon">🎌</div>
          <div className="state-title">{t('empty_title')}</div>
          <div className="state-sub" style={{ whiteSpace: 'pre-line' }}>
            {t('empty_sub')}
          </div>
          <button className="btn-primary" onClick={() => {
            const cards = store.studyFilter === 'all'
              ? allCards
              : allCards.filter(c => c.type === store.studyFilter)
            const forced = cards.slice(0, SESSION_SIZE).map(card => ({
              card,
              direction: Math.random() < 0.5 ? 'jp2pt' : 'pt2jp',
            }))
            setQueue(forced)
            setIdx(0)
            setFlipped(false)
            setShowAnswers(false)
            setSessionStats({ correct: 0, incorrect: 0 })
            setPhaseSync(forced.length > 0 ? 'studying' : 'empty')
          }}>
            {t('empty_force')}
          </button>
        </div>
      )}

      {/* Complete state */}
      {phase === 'complete' && (
        <div className="state-card">
          <div className="state-icon">🏆</div>
          <div className="state-title">{t('complete_title')}</div>
          <div className="session-result-stats">
            <div className="result-pill green">
              <div className="result-num">{sessionStats.correct}</div>
              <div className="result-lbl">{t('complete_correct')}</div>
            </div>
            <div className="result-pill red">
              <div className="result-num">{sessionStats.incorrect}</div>
              <div className="result-lbl">{t('complete_wrong')}</div>
            </div>
            <div className="result-pill">
              <div className="result-num">
                {sessionStats.correct + sessionStats.incorrect > 0
                  ? Math.round(sessionStats.correct / (sessionStats.correct + sessionStats.incorrect) * 100) + '%'
                  : '—'}
              </div>
              <div className="result-lbl">{t('complete_accuracy')}</div>
            </div>
          </div>
          <button className="btn-primary" onClick={startNewSession}>
            {t('btn_new_session')}
          </button>
        </div>
      )}

      {/* Answer buttons */}
      <div className={`answer-area ${showAnswers ? 'visible' : ''}`}>
        <button className="btn-answer btn-wrong" onClick={() => handleAnswer(false)}>
          ✕&nbsp; {t('btn_wrong')}
        </button>
        <button className="btn-answer btn-right" onClick={() => handleAnswer(true)}>
          ✓&nbsp; {t('btn_right')}
        </button>
      </div>

    </div>
  )
}