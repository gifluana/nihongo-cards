// App.jsx — Root component

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { DEFAULT_CARDS } from './data/cards'
import { playSound } from './utils/sounds'
import StudyView  from './views/StudyView'
import StatsView  from './views/StatsView'
import EditorView from './views/EditorView'

const STORAGE_KEY = 'nihongo_react_v1'

const defaultStore = {
  srData:         {},
  customCards:    [],
  totalCorrect:   0,
  totalIncorrect: 0,
  todayStudied:   0,
  todayDate:      '',
  streak:         0,
  lastStudyDate:  '',
  studyFilter:    'all',
}

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultStore, ...JSON.parse(raw) }
  } catch(e) {}
  return { ...defaultStore }
}

export default function App() {
  const { t, i18n } = useTranslation()

  const [store, setStore] = useState(loadStore)
  const [activeTab,  setActiveTab]  = useState('study')
  const [loadPhase,  setLoadPhase]  = useState('in')
  const [toast, setToast] = useState({ msg: '', show: false })
  const toastTimer = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  }, [store])

  useEffect(() => {
    const today = dateKey()
    if (store.todayDate !== today) {
      setStore(prev => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const continuedStreak = prev.lastStudyDate === dateKey(yesterday)
        return {
          ...prev,
          todayDate:     today,
          todayStudied:  0,
          streak:        continuedStreak ? prev.streak + 1 : (prev.todayStudied > 0 ? 1 : prev.streak),
          lastStudyDate: prev.todayStudied > 0 ? prev.todayDate : prev.lastStudyDate,
        }
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => setLoadPhase('out'),  2000)
    const t2 = setTimeout(() => {
      setLoadPhase('done')
      playSound('open')
    }, 2700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const updateStore = useCallback((updater) => {
    setStore(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater })
  }, [])

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current)
    setToast({ msg, show: true })
    toastTimer.current = setTimeout(() => setToast(st => ({ ...st, show: false })), 2200)
  }, [])

  const handleTabChange = (id) => {
    if (id === activeTab) return
    playSound('tap')
    setActiveTab(id)
  }

  const toggleLang = () => {
    playSound('tap')
    i18n.changeLanguage(i18n.language === 'en' ? 'pt' : 'en')
  }

  const allCards = [...DEFAULT_CARDS, ...store.customCards]

  const TABS = [
    { id: 'study',  icon: '🗂',  label: t('nav_study')    },
    { id: 'stats',  icon: '📊',  label: t('nav_progress') },
    { id: 'editor', icon: '✏️', label: t('nav_editor')   },
  ]

  return (
    <>
      {loadPhase !== 'done' && (
        <div className={`loading-screen ${loadPhase === 'out' ? 'out' : ''}`}>
          <div className="logo-ring-wrap">
            <div className="logo-ring" />
            <div className="logo-pill">
              <span className="logo-kanji">学</span>
            </div>
          </div>
          <div className="loading-title">Nihongo Cards</div>
          <div className="loading-sub">日本語を学ぼう</div>
          <div className="loading-dots">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
        </div>
      )}

      <div className={`app-root ${loadPhase !== 'in' ? 'visible' : ''}`}>

        <div className="bg-orbs" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        {/* Language toggle — fixed top right */}
        <button className="lang-toggle" onClick={toggleLang}>
          {i18n.language === 'en' ? '🇧🇷 PT' : '🇺🇸 EN'}
        </button>

        <div className="views-wrap">
          <StudyView
            active={activeTab === 'study'}
            store={store}
            allCards={allCards}
            updateStore={updateStore}
            showToast={showToast}
          />
          <StatsView
            active={activeTab === 'stats'}
            store={store}
            allCards={allCards}
          />
          <EditorView
            active={activeTab === 'editor'}
            store={store}
            updateStore={updateStore}
            showToast={showToast}
          />
        </div>

        <nav className="bottom-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.msg}</div>

      </div>
    </>
  )
}