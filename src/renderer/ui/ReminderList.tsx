import React from 'react';
import type { Reminder } from '../../shared/types';
import {
  IconClock,
  IconDelete,
  IconEdit,
  IconPaused,
  IconRepeat,
  IconRepeatOne,
  renderIcon,
} from './reminderIcons';

/** Thứ trong tuần ISO kiểu UI: T2 = đầu tuần (JS: 1=Mon … 6=Sat, 0=Sun) */
const WEEK_ORDER_MON_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

function jsDayToMonFirstIndex(d: number): number {
  return WEEK_ORDER_MON_FIRST.indexOf(d as (typeof WEEK_ORDER_MON_FIRST)[number]);
}

function formatWeekdayRanges(weekdays: number[]): string {
  const dayLabels: Record<number, string> = {
    0: 'CN',
    1: 'T2',
    2: 'T3',
    3: 'T4',
    4: 'T5',
    5: 'T6',
    6: 'T7',
  };
  const normalized = [...new Set(weekdays)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (normalized.length === 0) return '-';
  if (normalized.length === 7) return 'Hằng ngày';

  const sorted = [...normalized].sort((a, b) => jsDayToMonFirstIndex(a) - jsDayToMonFirstIndex(b));

  const ranges: Array<[number, number]> = [];
  let start = sorted[0];
  let end = sorted[0];
  let endIdx = jsDayToMonFirstIndex(end);
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const curIdx = jsDayToMonFirstIndex(current);
    if (curIdx === endIdx + 1) {
      end = current;
      endIdx = curIdx;
      continue;
    }
    ranges.push([start, end]);
    start = current;
    end = current;
    endIdx = curIdx;
  }
  ranges.push([start, end]);

  return ranges
    .map(([s, e]) => (s === e ? dayLabels[s] : `${dayLabels[s]} - ${dayLabels[e]}`))
    .join(', ');
}

function formatTimeRange(startHour: number, startMinute: number, endHour: number, endMinute: number): string {
  const start = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
  const end = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  return `${start} - ${end}`;
}

function isRepeatOnce(r: Reminder): boolean {
  if (r.schedule.type === 'windowedInterval') return !r.schedule.repeat;
  if (r.schedule.type === 'fixedDaily') return r.schedule.repeat === 'once';
  return false;
}

function scheduleLabel(r: Reminder): string {
  if (r.schedule.type === 'interval') {
    const min = Math.round(r.schedule.intervalMs / 60_000);
    return `Mỗi ${min} phút`;
  }
  if (r.schedule.type === 'windowedInterval') {
    const min = Math.round(r.schedule.intervalMs / 60_000);
    const timeRange = formatTimeRange(
      r.schedule.startHour,
      r.schedule.startMinute,
      r.schedule.endHour,
      r.schedule.endMinute,
    );
    const days = formatWeekdayRanges(r.schedule.weekdays);
    return `${days} • ${timeRange} • ${min}p`;
  }
  const hh = String(r.schedule.hour).padStart(2, '0');
  const mm = String(r.schedule.minute).padStart(2, '0');
  if (r.schedule.repeat === 'once') return `1 lần • ${hh}:${mm}`;
  return `Hằng ngày • ${hh}:${mm}`;
}

function descriptionLabel(r: Reminder): string {
  const dispMin = Math.round(r.config.displayMs / 60_000);
  if (r.schedule.type === 'interval') {
    const min = Math.round(r.schedule.intervalMs / 60_000);
    return `Lặp mỗi ${min} phút. Thông báo hiển thị ${dispMin} phút.`;
  }
  if (r.schedule.type === 'windowedInterval') {
    const min = Math.round(r.schedule.intervalMs / 60_000);
    const timeRange = formatTimeRange(
      r.schedule.startHour,
      r.schedule.startMinute,
      r.schedule.endHour,
      r.schedule.endMinute,
    );
    const days = formatWeekdayRanges(r.schedule.weekdays);
    const mode = r.schedule.repeat ? 'Lặp lại' : 'Chỉ chạy 1 lần';
    return `${days} | ${timeRange} | Mỗi ${min}p (Hiển thị trong ${dispMin}p)`;
  }
  const hh = String(r.schedule.hour).padStart(2, '0');
  const mm = String(r.schedule.minute).padStart(2, '0');
  if (r.schedule.repeat === 'once') {
    return `Một lần lúc ${hh}:${mm}. Hiển thị ${dispMin} phút.`;
  }
  return `Hằng ngày lúc ${hh}:${mm}. Hiển thị ${dispMin} phút.`;
}

export function ReminderList({
  initialReminders,
  onEdit,
  onCountChange,
}: {
  initialReminders?: Reminder[] | null;
  onEdit?: (reminder: Reminder) => void;
  onCountChange?: (count: number) => void;
}) {
  const [items, setItems] = React.useState<Reminder[]>([]);
  const dirtyRef = React.useRef(false);
  const refreshTimerRef = React.useRef<number | null>(null);

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

  const scheduleRefresh = React.useCallback(() => {
    // If hidden, don't waste IPC; mark dirty and refresh on focus/show.
    if (document.hidden) {
      dirtyRef.current = true;
      return;
    }
    // Coalesce bursts of events into a single refresh.
    if (refreshTimerRef.current != null) return;
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      dirtyRef.current = false;
      void refresh();
    }, 120);
  }, [refresh]);

  React.useEffect(() => {
    if (Array.isArray(initialReminders)) {
      applyReminders(initialReminders);
      // Seed from the boot snapshot for fast initial paint, but always
      // refresh from the source of truth because this component can be
      // mounted after creating/editing reminders in another tab.
      void refresh();
      return;
    }
    void refresh();
  }, [initialReminders, applyReminders, refresh]);

  // Event-driven updates: state changes pushed from main process.
  React.useEffect(() => {
    const off = window.reminder.onStateChanged(() => {
      scheduleRefresh();
    });
    return () => {
      off?.();
    };
  }, [scheduleRefresh]);

  // Refresh when app returns to foreground (covers "running in tray" + missed events).
  React.useEffect(() => {
    const onFocus = () => {
      scheduleRefresh();
    };
    const onVisibility = () => {
      if (!document.hidden) {
        scheduleRefresh();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [scheduleRefresh]);

  // Fallback polling (low frequency) when visible, to minimize risk of stale UI.
  React.useEffect(() => {
    const t = window.setInterval(() => {
      if (!document.hidden) scheduleRefresh();
    }, 60_000);
    return () => window.clearInterval(t);
  }, [scheduleRefresh]);

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
          role="button"
          tabIndex={0}
          onClick={() => onEdit?.(r)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEdit?.(r);
            }
          }}
        >
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 0 }}>
            <div className="remRowIcon">
              {renderIcon(r.config.icon, !isDisabled)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="remRowTitle">
                <span>{r.config.message}</span>
                <span
                  className="remRowNextIconSlot"
                  title={isRepeatOnce(r) ? 'Chỉ chạy 1 lần' : 'Lặp lại'}
                >
                  {isRepeatOnce(r) ? <IconRepeatOne /> : <IconRepeat />}
                </span>
              </div>
              <div className="remRowDesc">{descriptionLabel(r)}</div>
              <div className={'remRowNext' + (isDisabled ? ' paused' : '')}>
                <span className="remRowNextIconSlot">
                  {isDisabled ? <IconPaused /> : <IconClock />}
                </span>
                <span className="remRowNextLabel">{isDisabled ? 'PAUSED' : scheduleLabel(r)}</span>
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
          : ar.schedule.type === 'windowedInterval'
            ? (
              br.schedule.type === 'windowedInterval' &&
              ar.schedule.intervalMs === br.schedule.intervalMs &&
              ar.schedule.startHour === br.schedule.startHour &&
              ar.schedule.startMinute === br.schedule.startMinute &&
              ar.schedule.endHour === br.schedule.endHour &&
              ar.schedule.endMinute === br.schedule.endMinute &&
              ar.schedule.repeat === br.schedule.repeat &&
              ar.schedule.onceAt === br.schedule.onceAt &&
              ar.schedule.weekdays.join(',') === br.schedule.weekdays.join(',')
            )
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