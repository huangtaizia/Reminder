import React from 'react';
import type { Reminder } from '../../shared/types';
import { ICON_BY_ID, resolveIconId } from './reminderIcons';

function renderIcon(iconValue: string, active: boolean): React.ReactNode {
  const resolvedId = resolveIconId(iconValue);
  const found = resolvedId ? ICON_BY_ID.get(resolvedId) : null;

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
  if (r.schedule.repeat === 'once') return `ONCE: ${hh}:${mm}`;
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
  if (r.schedule.repeat === 'once') {
    return `One-time at ${hh}:${mm}. Notification shows for ${dispMin} minute(s).`;
  }
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

  const applyReminders = React.useCallback((reminders: Reminder[]) => {
    const sorted = [...reminders].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    setItems(sorted);
    onCountChange?.(sorted.length);
  }, [onCountChange]);

  const refresh = React.useCallback(async () => {
    const s = await window.reminder.getState();
    const reminders = (s?.reminders ?? []) as Reminder[];
    applyReminders(reminders);
  }, [applyReminders]);

  React.useEffect(() => { refresh(); }, [refresh]);

  // Poll state periodically so "auto disable" (especially for "once" reminders)
  // is reflected in UI without requiring user refresh.
  React.useEffect(() => {
    const t = setInterval(() => { void refresh(); }, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const toggleEnabled = React.useCallback(async (id: string) => {
    const current = items.find(x => x.id === id);
    if (!current) return;
    const updatedForIpc: Reminder = { ...current, enabled: !current.enabled };

    // Optimistic update to keep UI responsive.
    setItems(prev => prev.map(x => x.id === id ? updatedForIpc : x));

    try {
      const nextState = await window.reminder.upsertReminder(updatedForIpc as any);
      applyReminders((nextState?.reminders ?? []) as Reminder[]);
    } catch {
      refresh();
    }
  }, [items, applyReminders, refresh]);

  const deleteById = React.useCallback(async (id: string) => {
    setItems(prev => prev.filter(x => x.id !== id));
    try {
      const nextState = await window.reminder.deleteReminder(id);
      applyReminders((nextState?.reminders ?? []) as Reminder[]);
    } catch {
      refresh();
    }
  }, [applyReminders, refresh]);

  const onEditStable = React.useCallback((r: Reminder) => onEdit?.(r), [onEdit]);

  const onToggleStable = React.useCallback((id: string) => {
    void toggleEnabled(id);
  }, [toggleEnabled]);

  const onDeleteStable = React.useCallback((id: string) => {
    void deleteById(id);
  }, [deleteById]);

  const ReminderRow = React.useMemo(() => {
    type RowProps = {
      r: Reminder;
      onEdit?: (r: Reminder) => void;
      onToggle: (id: string) => void;
      onDelete: (id: string) => void;
    };

    const Row = ({ r, onEdit, onToggle, onDelete }: RowProps) => {
      const isDisabled = !r.enabled;

      return (
        <div
          key={r.id}
          className={'remRow' + (isDisabled ? ' disabled' : '')}
          onClick={() => onEdit?.(r)}
        >
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 0 }}>
            <div className="remRowIcon">
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
              onClick={() => onToggle(r.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggle(r.id); }}
            >
              <div className="toggleKnob" />
            </div>

            <div className="remRowDivider" />

            <button className="iconBtn" title="Edit" onClick={() => onEdit?.(r)}>
              <IconEdit />
            </button>

            <button className="iconBtn danger" title="Delete" onClick={() => onDelete(r.id)}>
              <IconDelete />
            </button>
          </div>
        </div>
      );
    };

    return React.memo(Row, (a, b) => {
      const ar = a.r; const br = b.r;
      return (
        ar.id === br.id &&
        ar.enabled === br.enabled &&
        ar.createdAt === br.createdAt &&
        ar.config.icon === br.config.icon &&
        ar.config.message === br.config.message &&
        ar.config.displayMs === br.config.displayMs &&
        ar.schedule.type === br.schedule.type &&
        (ar.schedule.type === 'interval'
          ? (br.schedule.type === 'interval' && ar.schedule.intervalMs === br.schedule.intervalMs)
          : (
              br.schedule.type === 'fixedDaily' &&
              ar.schedule.hour === br.schedule.hour &&
              ar.schedule.minute === br.schedule.minute &&
              ar.schedule.repeat === br.schedule.repeat &&
              ar.schedule.onceAt === br.schedule.onceAt
            )
        )
      );
    });
  }, []);

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
      {items.map(r => (
        <ReminderRow
          key={r.id}
          r={r}
          onEdit={onEditStable}
          onToggle={onToggleStable}
          onDelete={onDeleteStable}
        />
      ))}
      <div style={{ height: 100 }} />
    </div>
  );
}