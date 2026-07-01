'use client';

import { useState } from 'react';
import s from './admin.module.css';

interface CardData {
  id: number;
  title: string;
  price: string;
  sqft: string;
  lot_type: string;
  description: string;
  status: 'active' | 'hidden';
  image: string;
}

const initialCards: CardData[] = [
  {
    id: 1,
    title: 'Desert Bloom Casita',
    price: '$189,900',
    sqft: '1,200',
    lot_type: 'Premium Corner Lot',
    description:
      'Beautifully designed desert retreat featuring modern finishes, open-concept living, and a private patio with mountain views.',
    status: 'active',
    image: '/cards/card1.jpg',
  },
  {
    id: 2,
    title: 'Sunset Ridge Villa',
    price: '$214,500',
    sqft: '1,450',
    lot_type: 'Interior Lot',
    description:
      'Spacious villa with upgraded kitchen, spa-style bathroom, and energy-efficient construction throughout.',
    status: 'active',
    image: '/cards/card2.jpg',
  },
  {
    id: 3,
    title: 'Oasis Grand Estate',
    price: '$274,000',
    sqft: '1,780',
    lot_type: 'Waterfront Lot',
    description:
      'Our flagship estate home offering luxury living with a gourmet kitchen, dual vanity bath, and direct lake access.',
    status: 'active',
    image: '/cards/card3.jpg',
  },
];

const DEMO_PASSWORD = 'oasis2026';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [cards, setCards] = useState<CardData[]>(initialCards);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  /* ---- Login ---- */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (pw === DEMO_PASSWORD) {
        setAuthed(true);
      } else {
        setError('Invalid password. Please try again.');
      }
      setLoading(false);
    }, 600);
  };

  const handleLogout = () => {
    setAuthed(false);
    setPw('');
    setError('');
    setSelectedId(null);
  };

  /* ---- Editor helpers ---- */
  const selected = cards.find((c) => c.id === selectedId) ?? null;

  const updateField = (field: keyof CardData, value: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, [field]: value } : c,
      ),
    );
  };

  /* ---- Login Screen ---- */
  if (!authed) {
    return (
      <div className={s.loginWrap}>
        <div className={s.loginCard}>
          <div className={s.loginLogo}>🏝️</div>
          <h1 className={s.loginTitle}>Oasis Admin</h1>
          <p className={s.loginSub}>Resort Management Portal</p>

          <form className={s.loginForm} onSubmit={handleLogin}>
            <input
              className={s.loginInput}
              type="password"
              placeholder="Enter admin password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              className={s.loginBtn}
              type="submit"
              disabled={!pw.trim() || loading}
            >
              {loading ? 'Verifying…' : 'Unlock'}
            </button>
          </form>

          {error && <p className={s.loginError}>{error}</p>}
        </div>
      </div>
    );
  }

  /* ---- Dashboard ---- */
  return (
    <div className={s.dashboard}>
      {/* Top bar */}
      <header className={s.topbar}>
        <div className={s.topbarLeft}>
          <span className={s.topbarTitle}>Oasis Resort</span>
          <span className={s.topbarBadge}>Admin</span>
        </div>
        <div className={s.topbarRight}>
          <button className={s.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Editor layout */}
      <div className={s.editorLayout}>
        {/* Sidebar card list */}
        <aside className={s.cardList}>
          {cards.map((card) => (
            <div
              key={card.id}
              className={`${s.cardListItem} ${
                card.id === selectedId ? s.cardListItemActive : ''
              }`}
              onClick={() => setSelectedId(card.id)}
            >
              <img
                className={s.cardListThumb}
                src={card.image}
                alt={card.title}
              />
              <div className={s.cardListInfo}>
                <strong>{card.title}</strong>
                <span>{card.price}</span>
              </div>
              <div
                className={`${s.statusDot} ${
                  card.status === 'active' ? s.statusActive : s.statusHidden
                }`}
              />
            </div>
          ))}
        </aside>

        {/* Editor pane */}
        <main className={s.editorPane}>
          {!selected ? (
            <div className={s.editorEmpty}>
              Select a card from the sidebar to edit
            </div>
          ) : (
            <div className={s.editorForm}>
              <div className={s.editorHeader}>
                <h3>Edit — {selected.title}</h3>
              </div>

              <div className={s.fieldGrid}>
                {/* Title */}
                <div className={`${s.field} ${s.fieldFull}`}>
                  <span>Title</span>
                  <input
                    type="text"
                    value={selected.title}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>

                {/* Price */}
                <div className={s.field}>
                  <span>Price</span>
                  <input
                    type="text"
                    value={selected.price}
                    onChange={(e) => updateField('price', e.target.value)}
                  />
                </div>

                {/* Sqft */}
                <div className={s.field}>
                  <span>Square Feet</span>
                  <input
                    type="text"
                    value={selected.sqft}
                    onChange={(e) => updateField('sqft', e.target.value)}
                  />
                </div>

                {/* Lot type */}
                <div className={s.field}>
                  <span>Lot Type</span>
                  <input
                    type="text"
                    value={selected.lot_type}
                    onChange={(e) => updateField('lot_type', e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className={s.field}>
                  <span>Status</span>
                  <select
                    value={selected.status}
                    onChange={(e) => updateField('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                {/* Description */}
                <div className={`${s.field} ${s.fieldFull}`}>
                  <span>Description</span>
                  <textarea
                    rows={4}
                    value={selected.description}
                    onChange={(e) =>
                      updateField('description', e.target.value)
                    }
                  />
                </div>

                {/* Image URL */}
                <div className={`${s.field} ${s.fieldFull}`}>
                  <span>Image URL</span>
                  <input
                    type="text"
                    value={selected.image}
                    onChange={(e) => updateField('image', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
