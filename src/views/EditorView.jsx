// EditorView.jsx — Add, edit, delete custom cards

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { playSound } from '../utils/sounds'
import { DEFAULT_CARDS } from '../data/cards'

const emptyForm = { type: 'vocab', japanese: '', romaji: '', portuguese: '' }

export default function EditorView({ active, store, updateStore, showToast }) {
  const { t } = useTranslation()

  const [search,    setSearch]    = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form,      setForm]      = useState(emptyForm)

  const isKana = form.type === 'hiragana' || form.type === 'katakana'

  const q        = search.toLowerCase()
  const filtered = store.customCards.filter(c =>
    !q ||
    c.japanese.toLowerCase().includes(q) ||
    (c.portuguese || '').toLowerCase().includes(q) ||
    (c.romaji     || '').toLowerCase().includes(q)
  )

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
    playSound('tap')
  }

  function openEdit(card) {
    setEditingId(card.id)
    setForm({
      type:       card.type,
      japanese:   card.japanese,
      romaji:     card.romaji     || '',
      portuguese: card.portuguese || '',
    })
    setModalOpen(true)
    playSound('tap')
  }

  function closeModal() { setModalOpen(false) }

  function handleSave() {
    const jp   = form.japanese.trim()
    const rom  = form.romaji.trim()
    const port = form.portuguese.trim()

    if (!jp)             { showToast(t('warn_japanese'));    return }
    if (isKana && !rom)  { showToast(t('warn_romaji'));      return }
    if (!isKana && !port){ showToast(t('warn_translation')); return }

    const card = {
      id:         editingId || 'c_' + Date.now(),
      type:       form.type,
      japanese:   jp,
      romaji:     rom,
      portuguese: port,
      reading:    rom,
    }

    updateStore(s => {
      if (editingId) {
        return { ...s, customCards: s.customCards.map(c => c.id === editingId ? card : c) }
      }
      return { ...s, customCards: [...s.customCards, card] }
    })

    closeModal()
    playSound('save')
    showToast(editingId ? t('toast_updated') : t('toast_added'))
  }

  function handleDelete(id) {
    updateStore(s => ({
      ...s,
      customCards: s.customCards.filter(c => c.id !== id),
      srData: Object.fromEntries(Object.entries(s.srData).filter(([k]) => k !== id)),
    }))
    playSound('delete')
    showToast(t('toast_deleted'))
  }

  function typeName(tp) {
    return { hiragana: 'Hiragana', katakana: 'Katakana', vocab: 'Vocab', custom: 'Custom' }[tp] || tp
  }

  return (
    <div className={`view ${active ? 'active' : ''}`} style={{ position: 'relative' }}>

      {/* Top bar */}
      <div className="editor-top">
        <h2>{t('editor_title')}</h2>
        <div className="editor-info">
          {DEFAULT_CARDS.length} {t('editor_info_pre')} · {store.customCards.length} {t('editor_info_post')}
        </div>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Card list */}
      <div className="editor-list">
        {filtered.length === 0 ? (
          <div className="editor-empty" style={{ whiteSpace: 'pre-line' }}>
            {search ? t('no_results') : t('editor_empty')}
          </div>
        ) : (
          filtered.map(card => {
            const isCardKana = card.type === 'hiragana' || card.type === 'katakana'
            return (
              <div key={card.id} className="ec-row">
                <span className="ec-badge badge-custom">{typeName(card.type)}</span>
                <span className="ec-jp">{card.japanese}</span>
                <div className="ec-info">
                  <div className="ec-port">{isCardKana ? card.romaji : card.portuguese}</div>
                  {!isCardKana && card.reading && (
                    <div className="ec-reading">{card.reading}</div>
                  )}
                </div>
                <div className="ec-actions">
                  <button className="ec-btn edit" onClick={() => openEdit(card)} title={t('modal_edit')}>✎</button>
                  <button className="ec-btn del"  onClick={() => handleDelete(card.id)} title="Delete">✕</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={openAdd} title={t('modal_add')}>+</button>

      {/* Modal */}
      <div
        className={`modal-overlay ${modalOpen ? 'open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) closeModal() }}
      >
        <div className="modal-sheet">
          <div className="modal-handle" />
          <div className="modal-title">{editingId ? t('modal_edit') : t('modal_add')}</div>

          <div className="form-group">
            <label className="form-label">{t('lbl_type')}</label>
            <select
              className="form-select"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="vocab">{t('vocab_label')}</option>
              <option value="hiragana">Hiragana</option>
              <option value="katakana">Katakana</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('lbl_japanese')}</label>
            <input
              className="form-input jp"
              type="text"
              placeholder={t('ph_japanese')}
              value={form.japanese}
              onChange={e => setForm(f => ({ ...f, japanese: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{isKana ? t('lbl_romaji') : t('lbl_reading')}</label>
            <input
              className="form-input"
              type="text"
              placeholder={isKana ? t('ph_romaji_kana') : t('ph_romaji_vocab')}
              value={form.romaji}
              onChange={e => setForm(f => ({ ...f, romaji: e.target.value }))}
            />
          </div>

          {!isKana && (
            <div className="form-group">
              <label className="form-label">{t('lbl_translation')}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t('ph_translation')}
                value={form.portuguese}
                onChange={e => setForm(f => ({ ...f, portuguese: e.target.value }))}
              />
            </div>
          )}

          <div className="modal-actions">
            <button className="btn-cancel" onClick={closeModal}>{t('btn_cancel')}</button>
            <button className="btn-save"   onClick={handleSave}>{t('btn_save')}</button>
          </div>
        </div>
      </div>

    </div>
  )
}