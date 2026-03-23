import React from 'react';
import { ReminderList } from './ReminderList';
import { ReminderEditor } from './ReminderEditor';
import { Settings } from './Settings';
import type { Reminder } from '../../shared/types';

type TabKey = 'list' | 'create' | 'settings';

/* ── SVG Icons ── */
const IconBell = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 8px', display: 'block' }}>
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="#7eb8f7" />
  </svg>
);

const IconFolder = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M20 6H12L10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6ZM20 18H4V6H9.17L11.17 8H20V18Z" fill="#6ee7b7" />
  </svg>
);

const IconPower = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M13 3H11V13H13V3ZM17.83 5.17L16.41 6.59C17.99 7.86 19 9.81 19 12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12C5 9.81 6.01 7.86 7.58 6.58L6.17 5.17C4.23 6.82 3 9.26 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 9.26 19.77 6.82 17.83 5.17Z" fill="#f87171" />
  </svg>
);

const IconReminders = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const IconPencil = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

/* ── Close Dialog ── */
function CloseDialog({ onTray, onQuit, onCancel }: {
  onTray: () => void;
  onQuit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(173,198,255,.12)',
          borderRadius: 18, padding: '32px 28px 24px', width: 420,
          display: 'flex', flexDirection: 'column', gap: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#DAE2FD', marginBottom: 6 }}>
            Đóng cửa sổ
          </div>
          <div style={{ fontSize: 14, color: 'rgba(173,198,255,.5)', lineHeight: 1.5 }}>
            Bạn muốn làm gì với ứng dụng?
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(173,198,255,.08)' }} />

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onTray}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 18px', borderRadius: 12,
              background: '#222A3D', border: '1px solid #424754',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'border-color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(173,198,255,.35)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#424754')}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(110,231,183,.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconFolder />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#DAE2FD' }}>
                Chạy dưới khay hệ thống
              </div>
              <div style={{ fontSize: 13, color: 'rgba(173,198,255,.45)', marginTop: 3 }}>
                Vẫn hoạt động và nhắc nhở bình thường
              </div>
            </div>
          </button>

          <button
            onClick={onQuit}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 18px', borderRadius: 12,
              background: 'rgba(240,68,68,.06)', border: '1px solid rgba(240,68,68,.2)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'border-color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(240,68,68,.45)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(240,68,68,.2)')}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(240,68,68,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconPower />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#ff8080' }}>
                Thoát hoàn toàn
              </div>
              <div style={{ fontSize: 13, color: 'rgba(173,198,255,.45)', marginTop: 3 }}>
                Dừng nhắc nhở và đóng ứng dụng
              </div>
            </div>
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onCancel}
          style={{
            height: 40, borderRadius: 10,
            background: 'transparent',
            border: '1px solid rgba(173,198,255,.12)',
            color: 'rgba(173,198,255,.4)', fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
            transition: 'color .15s, border-color .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'rgba(173,198,255,.7)';
            e.currentTarget.style.borderColor = 'rgba(173,198,255,.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(173,198,255,.4)';
            e.currentTarget.style.borderColor = 'rgba(173,198,255,.12)';
          }}
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}

/* ── App ── */
export function App() {
  const [tab, setTab] = React.useState<TabKey>('list');
  const [masterEnabled, setMasterEnabled] = React.useState(false);
  const [booted, setBooted] = React.useState(false);
  const [editing, setEditing] = React.useState<Reminder | null>(null);
  const [showCloseDialog, setShowCloseDialog] = React.useState(false);
  const [reminderCount, setReminderCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    window.reminder.getState().then(s => {
      if (cancelled) return;
      setMasterEnabled(!!s?.settings?.masterEnabled);
      setReminderCount(s?.reminders?.length ?? 0);
      setBooted(true);
    }).catch(() => setBooted(true));
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!showCloseDialog) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCloseDialog(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [showCloseDialog]);

  const toggleMaster = () => {
    if (!booted) return;
    setMasterEnabled(v => {
      const next = !v;
      window.reminder.setSettings({ masterEnabled: next });
      return next;
    });
  };

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'list',     label: 'Reminders',  icon: <IconReminders /> },
    { key: 'create',   label: editing ? 'Edit Reminder' : 'New Reminder', icon: editing ? <IconPencil /> : <IconPlus /> },
    { key: 'settings', label: 'Settings',   icon: <IconSettings /> },
  ];

  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const year = now.getFullYear();

  return (
    <div className="window">
      {showCloseDialog && (
        <CloseDialog
          onTray={() => { setShowCloseDialog(false); window.reminder.closeWindow(); }}
          onQuit={() => { setShowCloseDialog(false); (window.reminder as any).quitApp(); }}
          onCancel={() => setShowCloseDialog(false)}
        />
      )}

      {/* Titlebar */}
      <div className="titlebar">
        <div className="right">
          <button className="tbBtn" title="Thu nhỏ" onClick={() => window.reminder.minimizeWindow()}>—</button>
          <button className="tbBtn tbClose" title="Đóng" onClick={() => setShowCloseDialog(true)}>✕</button>
        </div>
      </div>

      <div className="appBody">

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebarLogo" style={{ padding: '12px 20px 0' }}>
            <div className="appIcon" />
            <div className="appBrand">
              <div className="appName">Reminder</div>
              <div className="appTagline">{"We've got your back"}</div>
            </div>
          </div>

          <div className="sidebarNav" style={{ padding: '0 20px', marginTop: 10 }}>
            {navItems.map(item => (
              <div
                key={item.key}
                className={'sidebarItem' + (tab === item.key ? ' active' : '')}
                onClick={() => {
                  if (item.key !== 'create') setEditing(null);
                  setTab(item.key);
                }}
              >
                <span className="sidebarIcon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="sidebarBottom">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>
                  {masterEnabled ? 'Active' : 'Paused'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reminders</div>
              </div>
              <div
                className={'toggle' + (masterEnabled ? ' on' : '')}
                role="switch"
                aria-checked={masterEnabled}
                tabIndex={0}
                onClick={toggleMaster}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleMaster(); }}
              >
                <div className="toggleKnob" />
              </div>
            </div>

            <button className="newReminderBtn" onClick={() => { setEditing(null); setTab('create'); }}>
              <IconPlus />
              New Reminder
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {tab === 'list' && (
            <>
              <div className="listHeader">
                <div className="listHeaderLeft" style={{ minWidth: 0 }}>
                  <div className="listTitle">All your reminders</div>
                  <div className="listSubtitle">
                    {reminderCount > 0
                      ? `${reminderCount} reminder${reminderCount > 1 ? 's' : ''} scheduled`
                      : 'No reminders yet'}
                  </div>
                </div>
                <div className="listHeaderDate">
                  <div className="listDateDay">{day}</div>
                  <div className="listDateMonth">{month} {year}</div>
                </div>
              </div>
              <div className="remScroll">
                <ReminderList
                  onEdit={r => { setEditing(r); setTab('create'); }}
                  onCountChange={setReminderCount}
                />
              </div>
            </>
          )}

          {tab === 'create' && (
            <>
              <div className="contentHeader">
                <div className="contentTitle">{editing ? 'Edit Reminder' : 'Create New'}</div>
                <div className="contentSub">{editing ? 'Update your reminder' : 'Schedule a new reminder'}</div>
              </div>
              <ReminderEditor
                initial={editing}
                onSaved={() => { setEditing(null); setTab('list'); }}
              />
            </>
          )}

          {tab === 'settings' && (
            <>
              <div className="contentHeader">
                <div className="contentTitle">Settings</div>
                <div className="contentSub">Customize your experience</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <Settings />
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}