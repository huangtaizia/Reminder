import React from 'react';
import type { Reminder, ReminderSchedule } from '../../shared/types';

type ScheduleType = 'interval' | 'fixed';

/* ── Custom number input với button −/+ ── */
function NumberInput({
  value, min, max, step = 1, onChange, disabled,
}: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; disabled?: boolean;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const [decHover, setDecHover] = React.useState(false);
  const [incHover, setIncHover] = React.useState(false);

  const btnBase: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.06)',
    color: disabled ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.65)',
    fontSize: 18, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    flexShrink: 0, userSelect: 'none' as const,
    transition: 'background 0.12s, color 0.12s',
  };
  const hovered: React.CSSProperties = {
    background: 'rgba(255,255,255,0.13)',
    color: 'rgba(255,255,255,0.92)',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{ ...btnBase, ...(decHover && !disabled ? hovered : {}) }}
        onClick={disabled ? undefined : dec}
        onMouseEnter={() => setDecHover(true)}
        onMouseLeave={() => setDecHover(false)}
      >−</div>
      <input
        className="input"
        type="number"
        min={min} max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        style={{ textAlign: 'center', flex: 1 }}
      />
      <div
        style={{ ...btnBase, ...(incHover && !disabled ? hovered : {}) }}
        onClick={disabled ? undefined : inc}
        onMouseEnter={() => setIncHover(true)}
        onMouseLeave={() => setIncHover(false)}
      >+</div>
    </div>
  );
}

const ICONS = ['💧', '🏃', '👀', '🧘', '🍎', '☕', '🚲', '🌈', '🎮', '🎥', '✉️', '💉', '📁'];
const COLORS = ['#23a7f3', '#1ea0ff', '#2ecc71', '#f4b000', '#f04444', '#7b61ff', '#ff4db8'];

export function ReminderEditor({
  initial,
  onSaved,
}: {
  initial?: Reminder | null;
  onSaved?: () => void;
}) {
  const [message, setMessage] = React.useState('');
  const [icon, setIcon] = React.useState(ICONS[0]);
  const [color, setColor] = React.useState(COLORS[0]);
  const [scheduleType, setScheduleType] = React.useState<ScheduleType>('interval');
  const [intervalMin, setIntervalMin] = React.useState(30);
  const [displayMin, setDisplayMin] = React.useState(1);
  const [fixedHour, setFixedHour] = React.useState(11);
  const [fixedMinute, setFixedMinute] = React.useState(30);
  const DEFAULT_MESSAGE = 'Thông điệp nhắc nhở'

  React.useEffect(() => {
    if (!initial) return;
    setMessage(initial.config.message);
    setIcon(initial.config.icon);
    setColor(initial.config.color);
    setDisplayMin(Math.max(1, Math.round(initial.config.displayMs / 60_000)));
    if (initial.schedule.type === 'interval') {
      setScheduleType('interval');
      setIntervalMin(Math.max(1, Math.round(initial.schedule.intervalMs / 60_000)));
    } else {
      setScheduleType('fixed');
      setFixedHour(initial.schedule.hour);
      setFixedMinute(initial.schedule.minute);
    }
  }, [initial]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Scrollable form area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <div className="card">
          <div className="fieldLabel">Thông điệp</div>
          <textarea
            className="textarea"
            placeholder="Nhập thông điệp nhắc nhở..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div style={{ height: 18 }} />
          <div className="fieldLabel">Biểu tượng</div>
          <div className="fieldHelp">Bạn có thể copy biểu tượng bên ngoài và dán vào ô dưới đây</div>
          <div
            style={{
              marginTop: 10, height: 72, borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'grid', placeItems: 'center', fontSize: 28,
            }}
          >
            {icon}
          </div>

          <div className="chips" style={{ marginTop: 12 }}>
            {ICONS.map((ic) => (
              <div key={ic} className={'chip' + (ic === icon ? ' active' : '')} onClick={() => setIcon(ic)}>
                <span style={{ fontSize: 18 }}>{ic}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 18 }} />
          <div className="fieldLabel">Màu sắc thông điệp</div>
          <div className="palette">
            {COLORS.map((c) => (
              <div key={c} className={'swatch' + (c === color ? ' active' : '')} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>

          <div style={{ height: 18 }} />
          <div className="fieldLabel">Loại nhắc nhở</div>
          <div className="card" style={{ margin: 0, padding: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px' }}>
              <input type="radio" name="scheduleType" checked={scheduleType === 'interval'} onChange={() => setScheduleType('interval')} />
              <span>Lặp lại theo thời gian</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px' }}>
              <input type="radio" name="scheduleType" checked={scheduleType === 'fixed'} onChange={() => setScheduleType('fixed')} />
              <span>Theo giờ cố định</span>
            </label>
          </div>

          <div style={{ height: 18 }} />
          {scheduleType === 'fixed' && (
            <>
              <div className="fieldLabel">Giờ cố định (hàng ngày)</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <NumberInput value={fixedHour} min={0} max={23} onChange={setFixedHour} />
                <NumberInput value={fixedMinute} min={0} max={59} onChange={setFixedMinute} />
              </div>
              <div className="fieldHelp">So sánh với giờ hiện tại của máy. Nhắc mỗi ngày vào giờ này.</div>
              <div style={{ height: 18 }} />
            </>
          )}

          <div className="fieldLabel">Lặp lại mỗi (phút)</div>
          <NumberInput
            value={intervalMin} min={1} max={24 * 60}
            onChange={setIntervalMin} disabled={scheduleType !== 'interval'}
          />
          <div className="chips">
            {[15, 30, 60, 120].map((v) => (
              <div
                key={v}
                className={'chip' + (intervalMin === v ? ' active' : '')}
                onClick={() => setIntervalMin(v)}
                style={{ opacity: scheduleType === 'interval' ? 1 : 0.45 }}
              >
                {v === 60 ? '1h' : v === 120 ? '2h' : `${v}p`}
              </div>
            ))}
          </div>

          <div style={{ height: 18 }} />
          <div className="fieldLabel">Thời gian hiển thị thông báo (phút)</div>
          <NumberInput value={displayMin} min={1} max={24 * 60} onChange={setDisplayMin} />
          <div className="chips">
            {[1, 2, 3, 5].map((v) => (
              <div key={v} className={'chip' + (displayMin === v ? ' active' : '')} onClick={() => setDisplayMin(v)}>
                {v}p
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom button row */}
      <div className="btnRow">
        <button
          className="btn"
          onClick={async () => {
            await window.reminder.previewPopup({
              icon, color,
              message: message.trim() || DEFAULT_MESSAGE,
              displayMs: Math.max(1, Math.min(24 * 60, displayMin)) * 60_000,
            });
          }}
        >
          🔔 Xem trước
        </button>
        <button
          className="btn primary"
          onClick={async () => {
            const schedule: ReminderSchedule =
              scheduleType === 'interval'
                ? { type: 'interval', intervalMs: Math.max(1, intervalMin) * 60_000 }
                : { type: 'fixedDaily', hour: Math.max(0, Math.min(23, fixedHour)), minute: Math.max(0, Math.min(59, fixedMinute)) };
            const reminder: Partial<Reminder> = {
              id: initial?.id,
              createdAt: initial?.createdAt,
              enabled: initial?.enabled ?? true,
              schedule,
              config: {
                icon, color,
                message: message.trim() || DEFAULT_MESSAGE,
                displayMs: Math.max(1, Math.min(24 * 60, displayMin)) * 60_000,
              },
            };
            await window.reminder.upsertReminder(reminder as any);
            if (!initial) setMessage('');
            onSaved?.();
          }}
        >
          ✓ Lưu nhắc nhở
        </button>
      </div>
    </div>
  );
}