import React from 'react';
import type { Reminder, ReminderSchedule } from '../../shared/types';
import { ICONS, EMOJI_TO_ID } from './reminderIcons';

type ScheduleType = 'interval' | 'fixed';

const DEFAULT_MESSAGE = 'Thông điệp nhắc nhở';

function NumberInput({
  value, min, max, step = 1, onChange, disabled,
}: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; disabled?: boolean;
}) {
  const btn: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(255,255,255,0.05)',
    color: disabled ? 'rgba(255,255,255,0.20)' : '#C2C6D6',
    fontSize: 18, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    flexShrink: 0, userSelect: 'none' as const,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={btn} onClick={disabled ? undefined : () => onChange(Math.max(min, value - step))}>−</div>
      <input
        type="number" min={min} max={max} value={value} disabled={disabled}
        onChange={e => { const v = Number(e.target.value); if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v))); }}
        style={{
          flex: 1, textAlign: 'center', height: 32,
          background: '#222A3D',
          borderRadius: 8, color: '#DAE2FD', fontSize: 14,
          outline: 'none', fontFamily: 'inherit',
        }}
      />
      <div style={btn} onClick={disabled ? undefined : () => onChange(Math.min(max, value + step))}>+</div>
    </div>
  );
}

/* ── Smart time input: xử lý logic nhập giờ/phút ── */
function TimeInput({ value, max, onChange }: {
  value: number; max: number; onChange: (v: number) => void;
}) {
  const [raw, setRaw] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  const display = focused ? raw : String(value).padStart(2, '0');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9]/g, '');
    if (input === '') {
      setRaw('');
      onChange(0);
      return;
    }
    // Chỉ lấy tối đa 2 ký tự
    const trimmed = input.slice(-2);
    const num = parseInt(trimmed, 10);
    // Clamp theo max
    if (num <= max) {
      setRaw(trimmed);
      onChange(num);
    } else {
      // Nếu vượt max, lấy ký tự cuối
      const last = parseInt(input.slice(-1), 10);
      setRaw(String(last).padStart(2, '0'));
      onChange(last);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    setRaw('');
  };

  const handleFocus = () => {
    setFocused(true);
    setRaw('');
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      maxLength={2}
      style={{
        width: 52, background: 'transparent', border: 'none',
        color: '#DAE2FD', fontSize: 28, fontWeight: 700,
        textAlign: 'center', outline: 'none', fontFamily: 'inherit',
        letterSpacing: 1, cursor: 'text',
      }}
    />
  );
}

function FixedTimePicker({ hour, minute, onHourChange, onMinuteChange }: {
  hour: number; minute: number;
  onHourChange: (v: number) => void; onMinuteChange: (v: number) => void;
}) {
  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', color: '#ADC6FF',
    cursor: 'pointer', fontSize: 16, padding: '2px 12px', lineHeight: 1,
  };
  return (
    <div>
      <div style={{ fontSize: 14, color: '#C2C6D6', marginBottom: 8 }}>Thời gian bắt đầu</div>
      <div style={{
        background: '#222A3D', borderRadius: 12, padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
        border: '1px solid #424754',
      }}>
        {/* Giờ */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button style={btnStyle} onClick={() => onHourChange(hour >= 23 ? 0 : hour + 1)}>▲</button>
          <TimeInput value={hour} max={23} onChange={onHourChange} />
          <button style={btnStyle} onClick={() => onHourChange(hour <= 0 ? 23 : hour - 1)}>▼</button>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(173,198,255,0.4)', padding: '0 4px', userSelect: 'none' }}>:</div>
        {/* Phút */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button style={btnStyle} onClick={() => onMinuteChange(minute >= 59 ? 0 : minute + 1)}>▲</button>
          <TimeInput value={minute} max={59} onChange={onMinuteChange} />
          <button style={btnStyle} onClick={() => onMinuteChange(minute <= 0 ? 59 : minute - 1)}>▼</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(173,198,255,0.35)', marginTop: 6, textAlign: 'center' }}>
        Nhắc nhở mỗi ngày lúc {String(hour).padStart(2,'0')}:{String(minute).padStart(2,'0')}
      </div>
    </div>
  );
}

export function ReminderEditor({ initial, onSaved }: { initial?: Reminder | null; onSaved?: () => void }) {
  const [message, setMessage] = React.useState('');
  const [iconId, setIconId] = React.useState(ICONS[0].id);
  const [scheduleType, setScheduleType] = React.useState<ScheduleType>('interval');
  const [intervalMin, setIntervalMin] = React.useState(30);
  const [displayMin, setDisplayMin] = React.useState(1);
  const [fixedHour, setFixedHour] = React.useState(9);
  const [fixedMinute, setFixedMinute] = React.useState(0);

  React.useEffect(() => {
    if (!initial) return;
    setMessage(initial.config.message);
    // Tìm theo id, nếu không (data cũ dùng emoji) thì map sang id mới
    const iconVal = initial.config.icon;
    const matched = ICONS.find(i => i.id === iconVal)
      ?? ICONS.find(i => i.id === EMOJI_TO_ID[iconVal]);
    setIconId(matched ? matched.id : ICONS[0].id);
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

  // Color fixed to accent blue — no user color picker
  const color = '#3b9eff';

  const handleSave = async () => {
    const schedule: ReminderSchedule =
      scheduleType === 'interval'
        ? { type: 'interval', intervalMs: Math.max(1, intervalMin) * 60_000 }
        : { type: 'fixedDaily', hour: Math.max(0, Math.min(23, fixedHour)), minute: Math.max(0, Math.min(59, fixedMinute)) };
    await window.reminder.upsertReminder({
      id: initial?.id, createdAt: initial?.createdAt, enabled: initial?.enabled ?? true,
      schedule,
      config: { icon: iconId, color, message: message.trim() || DEFAULT_MESSAGE, displayMs: Math.max(1, Math.min(24 * 60, displayMin)) * 60_000 },
    } as any);
    if (!initial) setMessage('');
    onSaved?.();
  };

  const handlePreview = async () => {
    await window.reminder.previewPopup({
      icon: iconId, color,
      message: message.trim() || DEFAULT_MESSAGE,
      displayMs: Math.max(1, Math.min(24 * 60, displayMin)) * 60_000,
    });
  };

  const panel: React.CSSProperties = { background: 'var(--sidebar-bg)', borderRadius: 16, padding: 24 };
  const sectionLabel: React.CSSProperties = {
    fontSize: 14, fontWeight: 600, letterSpacing: '0.35px',
    textTransform: 'uppercase', color: '#ADC6FF', marginBottom: 16,
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* ── CỘT TRÁI ── */}
      <div style={{
        flex: 1, overflowY: 'auto', minWidth: 0,
        padding: '28px 24px 28px 32px',
        // borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>

        {/* Thông điệp */}
        <div style={panel}>
          <div style={sectionLabel}>Thông điệp nhắc nhở</div>
          <textarea
            style={{
              width: '100%', minHeight: 160, boxSizing: 'border-box',
              background: '#151B2B', border: 'none', borderRadius: 12,
              padding: '16px', color: '#DAE2FD', fontSize: 16, lineHeight: '24px',
              resize: 'none', outline: 'none', fontFamily: 'inherit',
            }}
            placeholder="Nhập nội dung nhắc nhở tại đây..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        {/* Biểu tượng — 4 cột, ô vuông thoáng */}
        <div style={panel}>
          <div style={sectionLabel}>Biểu tượng</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 6,
          }}>
            {ICONS.map(ic => {
              const active = iconId === ic.id;
              return (
                <div
                  key={ic.id}
                  onClick={() => setIconId(ic.id)}
                  style={{
                    /* ô vuông: dùng aspect-ratio */
                    aspectRatio: '1 / 1',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 4, borderRadius: 8, cursor: 'pointer',
                    background: active ? '#2D3449' : '#222A3D',
                    boxShadow: active ? '0 0 0 1.5px #ADC6FF' : 'none',
                    transition: 'background 0.15s, box-shadow 0.15s',
                    padding: '8px 4px',
                  }}
                >
                  <div style={{ color: active ? '#ADC6FF' : '#C2C6D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic.svg}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    letterSpacing: '-0.3px', textTransform: 'uppercase',
                    color: active ? '#ADC6FF' : '#C2C6D6',
                    textAlign: 'center', lineHeight: 1.3,
                    userSelect: 'none',
                  }}>
                    {ic.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── CỘT PHẢI ── */}
      <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', padding: '28px 24px 28px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 28, flex: 1 }}>

          <div style={sectionLabel}>Thiết lập thời gian</div>

          {/* Schedule type */}
          <div>
            <div style={{ fontSize: 14, color: '#C2C6D6', marginBottom: 10 }}>Loại nhắc nhở</div>
            {[
              { val: 'interval' as ScheduleType, label: 'Lặp lại theo chu kỳ' },
              { val: 'fixed' as ScheduleType, label: 'Theo giờ cố định' },
            ].map(opt => (
              <div key={opt.val} onClick={() => setScheduleType(opt.val)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 8,
                background: scheduleType === opt.val ? 'rgba(173,198,255,0.10)' : '#222A3D',
                boxShadow: scheduleType === opt.val ? '0 0 0 1px #ADC6FF' : 'none',
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  border: scheduleType === opt.val ? '4px solid #ADC6FF' : '2px solid rgba(173,198,255,0.3)',
                }} />
                <span style={{ fontSize: 14, color: scheduleType === opt.val ? '#DAE2FD' : '#C2C6D6' }}>{opt.label}</span>
              </div>
            ))}
          </div>

          {/* Fixed time */}
          {scheduleType === 'fixed' && (
            <FixedTimePicker
              hour={fixedHour} minute={fixedMinute}
              onHourChange={setFixedHour} onMinuteChange={setFixedMinute}
            />
          )}

          {/* Interval */}
          {scheduleType === 'interval' && (
            <div>
              <div style={{ fontSize: 14, color: '#C2C6D6', marginBottom: 8 }}>Lặp lại mỗi (phút)</div>
              {/* Input nhập thủ công */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#222A3D', border: '1px solid #424754',
                borderRadius: 12, padding: '4px 8px 4px 4px',
              }}>
                <button onClick={() => setIntervalMin(v => Math.max(1, v - 1))}
                  style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(173,198,255,0.08)', border: '1px solid rgba(173,198,255,0.15)', color: '#ADC6FF', fontSize: 18, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <input
                  type="number" min={1} max={1440} value={intervalMin}
                  onChange={e => {
                    const v = Number(e.target.value);
                    if (!isNaN(v)) setIntervalMin(Math.max(1, Math.min(1440, v)));
                  }}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: '#DAE2FD', fontSize: 16, fontWeight: 600,
                    textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button onClick={() => setIntervalMin(v => Math.min(1440, v + 1))}
                  style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(173,198,255,0.08)', border: '1px solid rgba(173,198,255,0.15)', color: '#ADC6FF', fontSize: 18, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              {/* Quick picks */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[15, 30, 60, 120, 180, 240].map(v => (
                  <div key={v} onClick={() => setIntervalMin(v)} style={{
                    padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: intervalMin === v ? 'rgba(173,198,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: intervalMin === v ? '1px solid rgba(173,198,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    color: intervalMin === v ? '#ADC6FF' : '#C2C6D6',
                    transition: 'all 0.12s',
                  }}>
                    {v < 60 ? `${v}p` : `${v/60}h`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duration slider */}
          <div style={{ paddingTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: '#C2C6D6' }}>Thời gian tồn tại</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#ADC6FF' }}>{displayMin} Phút</span>
            </div>
            <div style={{ position: 'relative', height: 4, borderRadius: 12, background: '#2D3449' }}>
              <div style={{ position: 'absolute', inset: 0, width: `${(displayMin / 60) * 100}%`, background: '#ADC6FF', borderRadius: 12 }} />
              <div style={{
                position: 'absolute', top: '50%', left: `${(displayMin / 60) * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 16, height: 16, borderRadius: '50%',
                background: '#ADC6FF', boxShadow: '0 0 10px rgba(173,198,255,0.5)',
              }} />
              <input type="range" min={1} max={60} value={displayMin}
                onChange={e => setDisplayMin(Number(e.target.value))}
                style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', margin: 0 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {['1M', '30M', '60M'].map(l => <span key={l} style={{ fontSize: 10, color: 'rgba(194,198,214,0.5)', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>{l}</span>)}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn" onClick={handlePreview} style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
              <svg width="12" height="12" viewBox="0 0 20 14" fill="currentColor">
                <path d="M10 0C5.45 0 1.57 2.93 0 7C1.57 11.07 5.45 14 10 14C14.55 14 18.43 11.07 20 7C18.43 2.93 14.55 0 10 0ZM10 11.5C7.52 11.5 5.5 9.48 5.5 7C5.5 4.52 7.52 2.5 10 2.5C12.48 2.5 14.5 4.52 14.5 7C14.5 9.48 12.48 11.5 10 11.5ZM10 4.5C8.62 4.5 7.5 5.62 7.5 7C7.5 8.38 8.62 9.5 10 9.5C11.38 9.5 12.5 8.38 12.5 7C12.5 5.62 11.38 4.5 10 4.5Z"/>
              </svg>
              Xem trước
            </button>
            <button className="btn primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center', gap: 8, marginTop: 2 }}>
              <svg width="12" height="12" viewBox="0 0 11 11" fill="currentColor">
                <path d="M9 0H2C0.9 0 0 0.9 0 2V9C0 10.1 0.9 11 2 11H9C10.1 11 11 10.1 11 9V2L9 0ZM5.5 9.5C4.12 9.5 3 8.38 3 7C3 5.62 4.12 4.5 5.5 4.5C6.88 4.5 8 5.62 8 7C8 8.38 6.88 9.5 5.5 9.5ZM7 3H2V1H7V3Z"/>
              </svg>
              Lưu nhắc nhở
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}