import React from 'react';
import type { Reminder } from '../../shared/types';

function scheduleLabel(r: Reminder): string {
  if (r.schedule.type === 'interval') {
    const min = Math.round(r.schedule.intervalMs / 60_000);
    return `Mỗi ${min} phút`;
  }
  const hh = String(r.schedule.hour).padStart(2, '0');
  const mm = String(r.schedule.minute).padStart(2, '0');
  return `Hàng ngày ${hh}:${mm}`;
}

export function ReminderList({
  onEdit,
}: {
  onEdit?: (reminder: Reminder) => void;
}) {
  const [items, setItems] = React.useState<Reminder[]>([]);

  const refresh = React.useCallback(async () => {
    const s = await window.reminder.getState();
    const reminders = (s?.reminders ?? []) as Reminder[];
    reminders.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    setItems(reminders);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div>
      {items.map((r) => (
        <div
          className="card"
          key={r.id}
          onClick={() => onEdit?.(r)}
          style={{ cursor: 'pointer' }}
          title="Nhấn để chỉnh sửa"
        >
          <div className="remItem">
            <div className="remLeft">
              <div className="remIcon" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 18 }}>{r.config.icon}</span>
              </div>
              <div className="remText">
                <div className="remMsg" style={{ color: r.config.color }}>
                  {r.config.message}
                </div>
                <div className="remSub">
                  <span>{scheduleLabel(r)}</span>
                  <span className="dot" style={{ background: r.config.color }} />
                </div>
              </div>
            </div>

            {/* stopPropagation trên remActions để click button không trigger onEdit card */}
            <div className="remActions" onClick={(e) => e.stopPropagation()}>
              <button className="iconBtn" title="Sửa" onClick={() => onEdit?.(r)}>
                ✎
              </button>
              <button
                className="iconBtn"
                title="Xóa"
                onClick={async () => {
                  await window.reminder.deleteReminder(r.id);
                  await refresh();
                }}
              >
                🗑
              </button>
              <div
                className={'toggle' + (r.enabled ? ' on' : '')}
                role="switch"
                aria-checked={r.enabled}
                tabIndex={0}
                onClick={() =>
                  setItems((prev) => {
                    const next = prev.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x));
                    const updated = next.find((x) => x.id === r.id);
                    if (updated) window.reminder.upsertReminder(updated as any).then(refresh);
                    return next;
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setItems((prev) => {
                      const next = prev.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x));
                      const updated = next.find((x) => x.id === r.id);
                      if (updated) window.reminder.upsertReminder(updated as any).then(refresh);
                      return next;
                    });
                }}
              >
                <div className="toggleKnob" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <div style={{ height: 16 }} />
    </div>
  );
}