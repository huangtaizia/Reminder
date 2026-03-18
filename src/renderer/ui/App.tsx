import React from 'react';
import { ReminderList } from './ReminderList';
import { ReminderEditor } from './ReminderEditor';
import { Settings } from './Settings';
import type { Reminder } from '../../shared/types';

type TabKey = 'list' | 'create' | 'settings';

/* ── Modal xác nhận khi đóng cửa sổ ── */
function CloseDialog({ onTray, onQuit, onCancel }: {
  onTray: () => void;
  onQuit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1c1e2a 0%, #13141c 100%)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          width: 320,
          display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,.6), 0 32px 80px rgba(0,0,0,.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Tiêu đề */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ marginBottom: 2 }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="#7eb8f7"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e8eeff', letterSpacing: '-.01em' }}>
            Đóng cửa sổ
          </div>
          <div style={{ fontSize: 12, color: 'rgba(200,215,255,.45)', lineHeight: 1.5 }}>
            Bạn muốn làm gì với ứng dụng?
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '0 -4px' }} />

        {/* Các lựa chọn */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onTray}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.08)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'background .15s, border-color .15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.09)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.14)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.05)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.08)';
            }}
          >
            <span style={{ flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 6H12L10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6ZM20 18H4V6H9.17L11.17 8H20V18Z" fill="#6ee7b7"/>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eeff' }}>
                Chạy dưới khay hệ thống
              </div>
              <div style={{ fontSize: 11, color: 'rgba(200,215,255,.40)', marginTop: 2 }}>
                Ứng dụng vẫn hoạt động và nhắc nhở
              </div>
            </div>
          </button>

          <button
            onClick={onQuit}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(255,80,80,.06)',
              border: '1px solid rgba(255,80,80,.12)',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'background .15s, border-color .15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,80,80,.12)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,80,80,.22)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,80,80,.06)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,80,80,.12)';
            }}
          >
            <span style={{ flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M13 3H11V13H13V3ZM17.83 5.17L16.41 6.59C17.99 7.86 19 9.81 19 12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12C5 9.81 6.01 7.86 7.58 6.58L6.17 5.17C4.23 6.82 3 9.26 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 9.26 19.77 6.82 17.83 5.17Z" fill="#f87171"/>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ff8080' }}>
                Thoát hoàn toàn
              </div>
              <div style={{ fontSize: 11, color: 'rgba(200,215,255,.40)', marginTop: 2 }}>
                Dừng nhắc nhở và đóng ứng dụng
              </div>
            </div>
          </button>
        </div>

        {/* Nút huỷ */}
        <button
          onClick={onCancel}
          style={{
            padding: '9px', borderRadius: 8,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,.07)',
            color: 'rgba(200,215,255,.40)',
            fontSize: 12, cursor: 'pointer',
            transition: 'color .15s, border-color .15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(200,215,255,.70)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.14)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(200,215,255,.40)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.07)';
          }}
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [tab, setTab] = React.useState<TabKey>('list');
  const [masterEnabled, setMasterEnabled] = React.useState(false);
  const [booted, setBooted] = React.useState(false);
  const [editing, setEditing] = React.useState<Reminder | null>(null);
  const [showCloseDialog, setShowCloseDialog] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    window.reminder
      .getState()
      .then((s) => {
        if (cancelled) return;
        setMasterEnabled(!!s?.settings?.masterEnabled);
        setBooted(true);
      })
      .catch(() => setBooted(true));
    return () => { cancelled = true; };
  }, []);

  // Đóng dialog bằng Escape
  React.useEffect(() => {
    if (!showCloseDialog) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCloseDialog(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showCloseDialog]);

  return (
    <div className="window" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Modal đóng cửa sổ */}
      {showCloseDialog && (
        <CloseDialog
          onTray={() => {
            setShowCloseDialog(false);
            window.reminder.closeWindow();
          }}
          onQuit={() => {
            setShowCloseDialog(false);
            (window.reminder as any).quitApp?.();
          }}
          onCancel={() => setShowCloseDialog(false)}
        />
      )}

      {/* ① CỐ ĐỊNH: Titlebar + Master toggle + Tabs */}
      <div style={{ flexShrink: 0 }}>
        <div className="titlebar">
          <div className="left">
            <div className="appIcon" />
            <div>Nhắc nhở sức khỏe</div>
          </div>
          <div className="right">
            <button className="tbBtn" title="Minimize" onClick={() => window.reminder.minimizeWindow()}>
              —
            </button>
            {/* Hiện dialog thay vì đóng thẳng */}
            <button className="tbBtn tbClose" title="Close" onClick={() => setShowCloseDialog(true)}>
              X
            </button>
          </div>
        </div>
        <div className="masterRow">
          <div className="label">
            <div className="title">Bật nhắc nhở</div>
            <div className="sub">{masterEnabled ? 'Đang bật' : 'Đang tắt'}</div>
          </div>
          <div
            className={'toggle' + (masterEnabled ? ' on' : '')}
            role="switch"
            aria-checked={masterEnabled}
            tabIndex={0}
            onClick={() => {
              if (!booted) return;
              setMasterEnabled((v) => {
                const next = !v;
                window.reminder.setSettings({ masterEnabled: next });
                return next;
              });
            }}
            onKeyDown={(e) => {
              if (!booted) return;
              if (e.key === 'Enter' || e.key === ' ')
                setMasterEnabled((v) => {
                  const next = !v;
                  window.reminder.setSettings({ masterEnabled: next });
                  return next;
                });
            }}
          >
            <div className="toggleKnob" />
          </div>
        </div>
        <div className="tabs">
          <div
            className={'tab' + (tab === 'list' ? ' active' : '')}
            onClick={() => { setEditing(null); setTab('list'); }}
          >
            Nhắc nhở
          </div>
          <div
            className={'tab' + (tab === 'create' ? ' active' : '')}
            onClick={() => { setEditing(null); setTab('create'); }}
          >
            Thêm mới
          </div>
          <div
            className={'tab' + (tab === 'settings' ? ' active' : '')}
            onClick={() => setTab('settings')}
          >
            Cài đặt
          </div>
        </div>
      </div>

      {/* ② SCROLL: Nội dung tab */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'list' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ReminderList
              onEdit={(r) => {
                setEditing(r);
                setTab('create');
              }}
            />
          </div>
        )}
        {tab === 'create' && (
          <ReminderEditor
            initial={editing}
            onSaved={() => {
              setEditing(null);
              setTab('list');
            }}
          />
        )}
        {tab === 'settings' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Settings />
          </div>
        )}
      </div>

    </div>
  );
}