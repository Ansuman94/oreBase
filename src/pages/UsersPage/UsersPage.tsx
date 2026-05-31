import { useState, useEffect } from 'react';
import type { UserRole } from '../../api/auth';
import { fetchUsers, createUser, updateUser } from '../../api/users';
import type { AppUser } from '../../api/users';
import './UsersPage.scss';

const ROLES: UserRole[] = ['viewer', 'analyst', 'admin'];

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type PanelMode = 'create' | 'edit';

export function UsersPage() {
  const [users,   setUsers]   = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [panelMode, setPanelMode]       = useState<PanelMode>('create');
  const [panelOpen, setPanelOpen]       = useState(false);
  const [editingUser, setEditingUser]   = useState<AppUser | null>(null);

  // form state
  const [fName,     setFName]     = useState('');
  const [fEmail,    setFEmail]    = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fRole,     setFRole]     = useState<UserRole>('viewer');
  const [fError,    setFError]    = useState('');
  const [fSaving,   setFSaving]   = useState(false);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setFName(''); setFEmail(''); setFPassword(''); setFRole('viewer'); setFError('');
    setEditingUser(null);
    setPanelMode('create');
    setPanelOpen(true);
  }

  function openEdit(u: AppUser) {
    setFName(u.name ?? ''); setFEmail(u.email); setFPassword(''); setFRole(u.role); setFError('');
    setEditingUser(u);
    setPanelMode('edit');
    setPanelOpen(true);
  }

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault();
    setFError('');
    setFSaving(true);
    try {
      const newUser = await createUser({ email: fEmail, password: fPassword, name: fName, role: fRole });
      setUsers(prev => [newUser, ...prev]);
      setPanelOpen(false);
    } catch (err) {
      setFError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setFSaving(false);
    }
  }

  async function handleUpdate(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!editingUser) return;
    setFError('');
    setFSaving(true);
    try {
      const updated = await updateUser(editingUser.id, {
        name:     fName,
        role:     fRole,
        password: fPassword || undefined,
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setPanelOpen(false);
    } catch (err) {
      setFError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setFSaving(false);
    }
  }

  return (
    <div className="users-page">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="users-page__header">
        <div className="users-page__header-left">
          <h1 className="users-page__title">User Management</h1>
          <span className="users-page__count">{loading ? '—' : users.length} users</span>
        </div>
        <button className="users-page__add-btn" onClick={openCreate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add user
        </button>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className={`users-page__body${panelOpen ? ' users-page__body--split' : ''}`}>

        {/* User list */}
        <div className="users-page__list">
          {loading && (
            <div className="users-page__skeleton-wrap">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="users-page__skeleton-row">
                  <div className="users-page__skeleton-avatar" />
                  <div className="users-page__skeleton-lines">
                    <div className="users-page__skeleton-line users-page__skeleton-line--name" />
                    <div className="users-page__skeleton-line users-page__skeleton-line--email" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="users-page__empty">No users found.</div>
          )}

          {!loading && users.map(u => (
            <div
              key={u.id}
              className={`users-page__row${editingUser?.id === u.id && panelOpen ? ' users-page__row--active' : ''}`}
              onClick={() => openEdit(u)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && openEdit(u)}
            >
              <div className={`users-page__avatar users-page__avatar--${u.role}`}>
                {getInitials(u.name, u.email)}
              </div>
              <div className="users-page__info">
                <span className="users-page__name">{u.name ?? u.email}</span>
                <span className="users-page__email">{u.email}</span>
              </div>
              <span className={`users-page__role users-page__role--${u.role}`}>{u.role}</span>
              <span className="users-page__date">{formatDate(u.created_at)}</span>
              <svg className="users-page__row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </div>

        {/* Create / Edit panel */}
        {panelOpen && (
          <div className="users-page__panel">
            <div className="users-page__panel-header">
              <span className="users-page__panel-title">
                {panelMode === 'create' ? 'New user' : 'Edit user'}
              </span>
              <button className="users-page__panel-close" onClick={() => setPanelOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="users-page__form" onSubmit={panelMode === 'create' ? handleCreate : handleUpdate}>

              <div className="users-page__field">
                <label className="users-page__label">Full name</label>
                <input
                  className="users-page__input"
                  type="text"
                  placeholder="Jane Doe"
                  value={fName}
                  onChange={e => setFName(e.target.value)}
                />
              </div>

              <div className="users-page__field">
                <label className="users-page__label">
                  Email {panelMode === 'create' && <span className="users-page__req">*</span>}
                </label>
                {panelMode === 'edit' ? (
                  <div className="users-page__readonly">{fEmail}</div>
                ) : (
                  <input
                    className="users-page__input"
                    type="email"
                    placeholder="jane@example.com"
                    required
                    value={fEmail}
                    onChange={e => setFEmail(e.target.value)}
                  />
                )}
              </div>

              <div className="users-page__field">
                <label className="users-page__label">
                  {panelMode === 'create'
                    ? <>Password <span className="users-page__req">*</span></>
                    : 'New password'}
                </label>
                <input
                  className="users-page__input"
                  type="password"
                  placeholder={panelMode === 'create' ? 'Min. 8 characters' : 'Leave blank to keep current'}
                  required={panelMode === 'create'}
                  minLength={panelMode === 'create' ? 8 : undefined}
                  value={fPassword}
                  onChange={e => setFPassword(e.target.value)}
                />
              </div>

              <div className="users-page__field">
                <label className="users-page__label">Role</label>
                <select
                  className="users-page__select"
                  value={fRole}
                  onChange={e => setFRole(e.target.value as UserRole)}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <span className="users-page__role-hint">
                  {fRole === 'viewer'  && 'Can browse minerals, suppliers, and search.'}
                  {fRole === 'analyst' && 'Viewer access + process routes, planner, and predictor.'}
                  {fRole === 'admin'   && 'Full access including user management.'}
                </span>
              </div>

              {fError && <div className="users-page__error">{fError}</div>}

              <button className="users-page__submit" type="submit" disabled={fSaving}>
                {fSaving
                  ? (panelMode === 'create' ? 'Creating…' : 'Saving…')
                  : (panelMode === 'create' ? 'Create user' : 'Save changes')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
