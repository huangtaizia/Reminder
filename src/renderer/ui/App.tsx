import React from 'react';
import { ReminderList } from './ReminderList';
import { ReminderEditor } from './ReminderEditor';
import { Settings } from './Settings';
import type { Reminder } from '../../shared/types';
type TabKey = 'list' | 'create' | 'settings';
export function App() {
  const [tab, setTab] = React.useState<TabKey>('list');
  const [masterEnabled, setMasterEnabled] = React.useState(false);
  const [booted, setBooted] = React.useState(false);
  const [editing, setEditing] = React.useState<Reminder | null>(null);
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
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="window" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

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
            <button className="tbBtn tbClose" title="Close" onClick={() => window.reminder.closeWindow()}>
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
            onClick={() => {
              setEditing(null);
              setTab('list');
            }}
          >
            Nhắc nhở
          </div>
          <div
            className={'tab' + (tab === 'create' ? ' active' : '')}
            onClick={() => {
              setEditing(null);
              setTab('create');
            }}
          >
            Thêm mới
          </div>
          <div className={'tab' + (tab === 'settings' ? ' active' : '')} onClick={() => setTab('settings')}>
            Cài đặt
          </div>
        </div>
      </div>

      {/* ② SCROLL: Nội dung tab — chỉ tab list/settings scroll tự do */}
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
          // ReminderEditor tự quản lý scroll + fixed buttons bên trong
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