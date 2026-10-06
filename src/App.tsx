import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('platform_token')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Something went wrong')
  return payload.data
}

type Person = {
  _id: string
  name: string
  bio?: string
  country?: string
  industry?: string
  profession?: string
  topics?: string[]
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function App() {
  const [page, setPage] = useState(window.location.hash.replace('#', '') || 'home')
  const [people, setPeople] = useState<Person[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'login' | 'register' | null>(null)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const onHash = () => setPage(window.location.hash.replace('#', '') || 'home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    api('/api/auth/me').then(setUser).catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (page === 'directory' || page === 'home') {
      setLoading(true)
      api(`/api/people?limit=8${query ? `&search=${encodeURIComponent(query)}` : ''}`)
        .then((data) => setPeople(data.items || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [page, query])

  function navigate(next: string) {
    window.location.hash = next
  }

  function logout() {
    localStorage.removeItem('platform_token')
    setUser(null)
    setToast('You have been signed out.')
  }

  function handleAuth(data: { token: string; user: { name: string; email: string } }) {
    localStorage.setItem('platform_token', data.token)
    setUser(data.user)
    setModal(null)
    setToast(`Welcome back, ${data.user.name.split(' ')[0]}.`)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('home')} aria-label="Go home">
          <span className="brand-mark">P</span>
          <span>People<span className="brand-dot">.</span>index</span>
        </button>
        <nav>
          <button className={page === 'directory' ? 'active' : ''} onClick={() => navigate('directory')}>Explore</button>
          <button className={page.startsWith('taxonomy') ? 'active' : ''} onClick={() => navigate('taxonomy/industries')}>Browse</button>
          <button onClick={() => navigate('about')}>About</button>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-pill"><span className="mini-avatar">{initials(user.name)}</span>{user.name}</span>
              <button className="text-button" onClick={() => navigate('dashboard')}>My profile</button>
              <button className="text-button" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <button className="text-button" onClick={() => setModal('login')}>Sign in</button>
              <button className="button button-dark compact" onClick={() => setModal('register')}>Join index</button>
            </>
          )}
        </div>
      </header>

      <main>
        {page === 'about' ? <About onBack={() => navigate('home')} /> : page.startsWith('profile/') ? <ProfilePage id={page.split('/')[1]} onBack={() => navigate('directory')} /> : page.startsWith('taxonomy/') ? <TaxonomyPage type={page.split('/')[1]} onNavigate={navigate} /> : page === 'dashboard' ? <Dashboard user={user} onNavigate={navigate} /> : (
          <>
            <section className="hero-section">
              <div className="eyebrow"><span className="eyebrow-line" /> A living directory of people doing meaningful work</div>
              <h1>Find the people<br /><em>behind the ideas.</em></h1>
              <p className="hero-copy">Discover builders, thinkers, and change-makers from every corner of the world. Explore their work, follow their journey, and find your next connection.</p>
              <div className="search-bar hero-search">
                <span className="search-icon">⌕</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && navigate('directory')} placeholder="Search by name, role, or topic..." />
                <button onClick={() => navigate('directory')}>Search <span>↗</span></button>
              </div>
              <div className="hero-note"><span className="status-dot" /> New profiles are added every week <span className="note-divider" /> <button onClick={() => navigate('directory')}>Explore the index →</button></div>
            </section>

            <section className="stats-strip">
              <div><strong>12k<span>+</span></strong><small>People indexed</small></div>
              <div><strong>84</strong><small>Countries represented</small></div>
              <div><strong>32</strong><small>Industries explored</small></div>
              <div className="stats-quote">“A clearer way to find the people shaping what’s next.”</div>
            </section>

            <section className="directory-section">
              <div className="section-heading">
                <div><span className="eyebrow">CURATED DISCOVERY</span><h2>{page === 'directory' ? 'Explore the index' : 'People worth knowing'}</h2></div>
                <button className="arrow-link" onClick={() => navigate('directory')}>View all people <span>↗</span></button>
              </div>
              {error && <div className="inline-error">{error}. Make sure the backend is running on port 5000.</div>}
              {loading ? <div className="loading">Loading the index<span>...</span></div> : (
                <div className="people-grid">
                  {people.map((person, index) => <PersonCard key={person._id || index} person={person} onOpen={() => navigate(`profile/${person._id}`)} />)}
                  {!people.length && !error && <div className="empty-state">No profiles found yet. Try another search.</div>}
                </div>
              )}
            </section>

            <section className="join-banner">
              <div><span className="eyebrow light">YOUR WORK BELONGS HERE</span><h2>Make your work<br /><em>easier to find.</em></h2></div>
              <div className="join-side"><p>Create a profile that tells your story, connects your work, and puts you in the right rooms.</p><button className="button button-light" onClick={() => setModal('register')}>Create your profile <span>↗</span></button></div>
            </section>
          </>
        )}
      </main>

      <footer><div className="brand footer-brand"><span className="brand-mark">P</span><span>People<span className="brand-dot">.</span>index</span></div><span>Built for the curious.</span><span>© 2025 People Index</span></footer>
      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} onSuccess={handleAuth} />}
      {toast && <button className="toast" onClick={() => setToast('')}>{toast} <span>×</span></button>}
    </div>
  )
}

function PersonCard({ person, onOpen }: { person: Person; onOpen?: () => void }) {
  return <article className="person-card" onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onKeyDown={(event) => event.key === 'Enter' && onOpen?.()}>
    <div className="card-top"><div className="avatar">{initials(person.name)}</div><span className="card-arrow">↗</span></div>
    <h3>{person.name}</h3><p className="person-role">{person.profession || person.industry || 'Independent contributor'}</p>
    <p className="person-bio">{person.bio || 'A thoughtful person building meaningful things and sharing what they learn.'}</p>
    <div className="card-footer"><span>{person.country || 'Global'}</span><span>{person.topics?.[0] || 'Featured'}</span></div>
  </article>
}

function ProfilePage({ id, onBack }: { id: string; onBack: () => void }) {
  const [person, setPerson] = useState<Person | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/api/people/${id}`).then(setPerson).catch((err) => setError(err.message))
  }, [id])

  if (error) return <section className="detail-page"><button className="arrow-link" onClick={onBack}>← Back to index</button><div className="inline-error">{error}</div></section>
  if (!person) return <section className="detail-page"><div className="loading">Loading profile...</div></section>

  return <section className="detail-page">
    <button className="arrow-link" onClick={onBack}>← Back to index</button>
    <div className="profile-layout">
      <div><div className="profile-avatar">{initials(person.name)}</div><span className="eyebrow">PROFILE / {person.country || 'GLOBAL'}</span></div>
      <div className="profile-copy"><span className="eyebrow">PEOPLE.INDEX MEMBER</span><h1>{person.name}</h1><p className="profile-role">{person.profession || person.industry || 'Independent contributor'}</p><p className="profile-bio">{person.bio || 'This person is building meaningful things and sharing what they learn.'}</p><div className="profile-meta"><div><span>Based in</span><strong>{person.country || 'The world'}</strong></div><div><span>Industry</span><strong>{person.industry || 'Independent'}</strong></div><div><span>Focus</span><strong>{person.topics?.join(', ') || 'Curious work'}</strong></div></div></div>
    </div>
    <div className="profile-rule" /><div className="profile-footer"><span>Interested in this profile?</span><button className="button button-dark">Connect ↗</button></div>
  </section>
}

function TaxonomyPage({ type, onNavigate }: { type: string; onNavigate: (page: string) => void }) {
  const [items, setItems] = useState<{ _id: string; name: string; slug?: string }[]>([])
  const [error, setError] = useState('')
  const validType = ['industries', 'professions', 'topics'].includes(type) ? type : 'industries'

  useEffect(() => {
    api(`/api/taxonomy/${validType}`).then(setItems).catch((err) => setError(err.message))
  }, [validType])

  return <section className="taxonomy-page">
    <span className="eyebrow">EXPLORE BY CATEGORY</span><h1>Find your<br /><em>next direction.</em></h1>
    <div className="taxonomy-tabs">{['industries', 'professions', 'topics'].map((tab) => <button className={validType === tab ? 'selected' : ''} key={tab} onClick={() => onNavigate(`taxonomy/${tab}`)}>{tab}</button>)}</div>
    {error ? <div className="inline-error">{error}</div> : <div className="taxonomy-grid">{items.map((item, index) => <button className="taxonomy-card" key={item._id || index} onClick={() => onNavigate(`directory?${validType.slice(0, -1)}=${encodeURIComponent(item.name)}`)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.name}</strong><b>↗</b></button>)}{!items.length && <div className="empty-state">No categories have been added yet.</div>}</div>}
  </section>
}

function Dashboard({ user, onNavigate }: { user: { name: string; email: string } | null; onNavigate: (page: string) => void }) {
  if (!user) return <section className="detail-page"><span className="eyebrow">MEMBER AREA</span><h1>Sign in to see<br /><em>your profile.</em></h1><button className="button button-dark" onClick={() => onNavigate('home')}>Return home ↗</button></section>
  return <section className="dashboard-page"><span className="eyebrow">YOUR INDEX PROFILE</span><div className="dashboard-head"><div className="profile-avatar">{initials(user.name)}</div><div><h1>{user.name}</h1><p>{user.email}</p></div><span className="dashboard-status">ACTIVE MEMBER</span></div><div className="dashboard-grid"><div><span className="eyebrow">NEXT STEP</span><h2>Tell the index<br /><em>what you do.</em></h2><p>Add your location, profession, and focus areas so the right people can discover your work.</p><button className="button button-dark" onClick={() => onNavigate('directory')}>Explore other profiles ↗</button></div><div className="dashboard-list"><div><span>01</span><strong>Complete your profile</strong><small>Add a bio and professional focus</small></div><div><span>02</span><strong>Find your people</strong><small>Browse the curated directory</small></div><div><span>03</span><strong>Share your profile</strong><small>Make your work easier to find</small></div></div></div></section>
}

function AuthModal({ mode, onClose, onSuccess }: { mode: 'login' | 'register'; onClose: () => void; onSuccess: (data: { token: string; user: { name: string; email: string } }) => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const register = mode === 'register'
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try { onSuccess(await api(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(form) })) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to continue') }
    finally { setBusy(false) }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="auth-modal">
    <button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">PEOPLE.INDEX</span><h2>{register ? 'Add your name<br /><em>to the index.</em>' : 'Welcome<br /><em>back.</em>'}</h2><p>{register ? 'Create a profile and make your work easier to find.' : 'Sign in to manage your profile and connections.'}</p>
    <form onSubmit={submit}>{register && <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></label>}<label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label><label>Password<input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label>{error && <div className="form-error">{error}</div>}<button className="button button-dark full" disabled={busy}>{busy ? 'Please wait...' : register ? 'Create profile ↗' : 'Sign in ↗'}</button></form>
  </div></div>
}

function About({ onBack }: { onBack: () => void }) {
  return <section className="about-page"><button className="arrow-link" onClick={onBack}>← Back to index</button><span className="eyebrow">ABOUT PEOPLE.INDEX</span><h1>A better map of<br /><em>human potential.</em></h1><p>People Index is an open, living directory for discovering the people behind the ideas, products, communities, and movements shaping our shared future.</p><button className="button button-dark" onClick={onBack}>Start exploring ↗</button></section>
}

export default App
