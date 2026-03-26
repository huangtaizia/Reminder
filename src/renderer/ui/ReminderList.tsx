import React from 'react';
import type { Reminder } from '../../shared/types';
import { ICONS } from './ReminderEditor';

// Map emoji cũ → id mới (tương thích data cũ trước khi đổi sang SVG icon)
const EMOJI_TO_ID: Record<string, string> = {
  '💧': 'water', '🏃': 'run', '✉️': 'email', '☕': 'coffee',
  '🧘': 'rest',  '⚡': 'charge', '👀': 'eyes', '🍎': 'food',
  '🚲': 'bike',  '🌈': 'meditate', '🎮': 'stretch', '📁': 'folder',
  '💉': 'water', '🎥': 'folder',
};

function renderIcon(iconValue: string, active: boolean): React.ReactNode {
  const resolvedId = ICONS.find(i => i.id === iconValue)
    ? iconValue
    : (EMOJI_TO_ID[iconValue] ?? null);

  const found = resolvedId ? ICONS.find(i => i.id === resolvedId) : null;

  if (!found) {
    // Emoji gốc hoặc fallback chuông
    return (
      <span style={{ fontSize: 20, lineHeight: 1 }}>
        {iconValue && iconValue.length <= 2 ? iconValue : '🔔'}
      </span>
    );
  }

  return (
    <div style={{
      color: active ? '#ADC6FF' : '#C2C6D6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: 'scale(0.75)', transformOrigin: 'center',
    }}>
      {found.svg}
    </div>
  );
}

function scheduleLabel(r: Reminder): string {
  if (r.schedule.type === 'interval') {
    const min = Math.round(r.schedule.intervalMs / 60_000);
    return min >= 60 ? `Every ${min / 60}h` : `Every ${min} min`;
  }
  const hh = String(r.schedule.hour).padStart(2, '0');
  const mm = String(r.schedule.minute).padStart(2, '0');
  return `NEXT: ${hh}:${mm}`;
}

function descriptionLabel(r: Reminder): string {
  const dispMin = Math.round(r.config.displayMs / 60_000);
  if (r.schedule.type === 'interval') {
    const min = Math.round(r.schedule.intervalMs / 60_000);
    return `Repeats every ${min} minutes. Notification shows for ${dispMin} minute(s).`;
  }
  const hh = String(r.schedule.hour).padStart(2, '0');
  const mm = String(r.schedule.minute).padStart(2, '0');
  return `Daily at ${hh}:${mm}. Notification shows for ${dispMin} minute(s).`;
}

const IconClock = () => (
  <svg width="11" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" />
  </svg>
);

const IconPaused = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 11h-5.18C12.4 9.84 11.3 9 10 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c1.3 0 2.4-.84 2.82-2H18v2l3-3-3-3v2zM10 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

const IconEdit = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

const IconDelete = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

export function ReminderList({
  onEdit,
  onCountChange,
}: {
  onEdit?: (reminder: Reminder) => void;
  onCountChange?: (count: number) => void;
}) {
  const [items, setItems] = React.useState<Reminder[]>([]);

  const refresh = React.useCallback(async () => {
    const s = await window.reminder.getState();
    const reminders = (s?.reminders ?? []) as Reminder[];
    reminders.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    setItems(reminders);
    onCountChange?.(reminders.length);
  }, [onCountChange]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const toggleEnabled = (id: string) => {
    setItems(prev => {
      const next = prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x);
      const updated = next.find(x => x.id === id);
      if (updated) window.reminder.upsertReminder(updated as any).then(refresh);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="emptyState">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(173,198,255,0.15)">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        <div className="emptyStateText">
          No reminders yet<br />
          <span style={{ fontSize: 13 }}>Click &quot;+ New Reminder&quot; to get started</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 0 }}>
      {items.map(r => {
        const isDisabled = !r.enabled;
        // icon bg tinted theo accent blue (#3b9eff) vì không còn color per-reminder
        const iconBg = isDisabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59,158,255,0.12)';

        return (
          <div
            key={r.id}
            className={'remRow' + (isDisabled ? ' disabled' : '')}
            onClick={() => onEdit?.(r)}
          >
            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 0 }}>
              <div className="remRowIcon" style={{ background: iconBg }}>
                {renderIcon(r.config.icon, !isDisabled)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="remRowTitle">
                  <span>{r.config.message}</span>
                </div>
                <div className="remRowDesc">{descriptionLabel(r)}</div>
                <div className={'remRowNext' + (isDisabled ? ' paused' : '')}>
                  {isDisabled ? <IconPaused /> : <IconClock />}
                  <span>{isDisabled ? 'PAUSED' : scheduleLabel(r)}</span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="remRowActions" onClick={e => e.stopPropagation()}>
              <div
                className={'toggle' + (r.enabled ? ' on' : '')}
                role="switch" aria-checked={r.enabled} tabIndex={0}
                onClick={() => toggleEnabled(r.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleEnabled(r.id); }}
              >
                <div className="toggleKnob" />
              </div>

              <div className="remRowDivider" />

              <button className="iconBtn" title="Edit" onClick={() => onEdit?.(r)}>
                <IconEdit />
              </button>

              <button className="iconBtn danger" title="Delete" onClick={async () => {
                await window.reminder.deleteReminder(r.id);
                await refresh();
              }}>
                <IconDelete />
              </button>
            </div>
          </div>
        );
      })}
      <div style={{ height: 100 }} />
    </div>
  );
}