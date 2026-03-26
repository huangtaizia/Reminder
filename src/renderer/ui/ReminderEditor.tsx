import React from 'react';
import type { Reminder, ReminderSchedule } from '../../shared/types';

type ScheduleType = 'interval' | 'fixed';

const DEFAULT_MESSAGE = 'Thông điệp nhắc nhở';

export const ICONS: { id: string; label: string; svg: React.ReactNode }[] = [
  {
    id: 'water', label: 'Uống nước',
    svg: <svg width="32" height="32" viewBox="0 0 16 20" fill="currentColor"><path d="M8 0L1 8C1 12.42 4.13 16 8 16C11.87 16 15 12.42 15 8L8 0ZM8 14.5C5 14.5 2.5 11.84 2.5 8.5L8 2.1L13.5 8.5C13.5 11.84 11 14.5 8 14.5Z"/><path d="M4.5 9.5C4.5 11.43 6.07 13 8 13V11.5C6.9 11.5 6 10.6 6 9.5H4.5Z"/></svg>,
  },
    {
    id: 'run', label: 'Vận động',
    svg: <svg width="32" height="32" viewBox="0 0 90 82" fill="currentColor"><path d="M42.918 50.129c-1.144 0-2.277-.497-3.054-1.454-1.367-1.685-1.108-4.159.577-5.526l22.419-18.18c1.685-1.364 4.159-1.108 5.526.577 1.366 1.686 1.108 4.159-.577 5.526L45.39 49.251c-.728.591-1.603.878-2.472.878z"/><path d="M71.946 43.083c-1.343 0-2.648-.69-3.381-1.924l-6.608-11.133c-1.108-1.865-.493-4.276 1.372-5.383 1.866-1.107 4.277-.492 5.383 1.373l4.664 7.857 10.793-5.967c1.9-1.05 4.289-.361 5.339 1.537 1.049 1.899.362 4.289-1.537 5.339l-14.128 7.81c-.605.333-1.257.491-1.897.491z"/><path d="M38.608 34.788c-1.203 0-2.391-.551-3.161-1.593-1.29-1.744-.922-4.204.822-5.494l11.837-8.758c1.092-.808 2.525-.995 3.787-.492l14.893 5.92c2.016.801 3.001 3.085 2.199 5.102-.801 2.017-3.086 3-5.101 2.2l-12.862-5.112-10.08 7.458c-.703.569-1.522.769-2.334.769z"/><circle cx="76.622" cy="19.962" r="6.782"/><path d="M20.115 74.459c-1.237 0-2.455-.582-3.219-1.673-1.246-1.776-.816-4.226.96-5.472l15.626-10.962 5.916-11.901c.966-1.943 3.325-2.733 5.266-1.77 1.943.966 2.735 3.324 1.77 5.266l-6.36 12.795c-.292.587-.726 1.091-1.262 1.467L22.368 73.746c-.687.482-1.474.713-2.253.713z"/><path d="M57.856 56.365c-.504 0-1.017-.098-1.511-.304l-14.943-6.235c-2.002-.835-2.948-3.136-2.112-5.138.836-2.002 3.137-2.946 5.138-2.112L59.37 48.81c2.003.835 2.948 3.136 2.113 5.138-.629 1.507-2.089 2.417-3.627 2.417z"/><path d="M50.014 76.82c-.467 0-.943-.083-1.405-.261-2.026-.777-3.039-3.049-2.262-5.075l7.842-20.456c.777-2.026 3.048-3.04 5.075-2.263s3.038 3.049 2.263 5.075l-7.843 20.456c-.629 1.564-2.119 2.524-3.67 2.524z"/><path d="M31.603 45.981H1.964C.879 45.981 0 45.102 0 44.017c0-1.085.879-1.964 1.964-1.964h29.639c1.085 0 1.964.879 1.964 1.964 0 1.085-.88 1.964-1.964 1.964z"/><path d="M27.581 35.524H9.204c-1.085 0-1.964-.879-1.964-1.964s.879-1.964 1.964-1.964h18.377c1.085 0 1.964.879 1.964 1.964s-.879 1.964-1.964 1.964z"/><path d="M25.168 56.438H9.204c-1.085 0-1.964-.879-1.964-1.964s.879-1.964 1.964-1.964h15.964c1.085 0 1.964.879 1.964 1.964s-.879 1.964-1.964 1.964z"/></svg>,
  },
  {
    id: 'email', label: 'Ghi email',
    svg: <svg width="32" height="32" viewBox="0 0 20 16" fill="currentColor"><path d="M18 0H2C0.9 0 0 0.9 0 2V14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0ZM18 4L10 9L2 4V2L10 7L18 2V4Z"/></svg>,
  },
  {
    id: 'coffee', label: 'Uống cafe',
    svg: <svg width="32" height="32" viewBox="0 0 18 18" fill="currentColor"><path d="M14 6H2V12C2 13.66 3.34 15 5 15H11C12.66 15 14 13.66 14 12V11H15C16.1 11 17 10.1 17 9C17 7.9 16.1 7 15 7H14V6ZM15 9H14V8H15C15.55 8 16 8.45 16 9C16 9.55 15.55 10 15 10V9ZM3 12V7H13V12C13 13.1 12.1 14 11 14H5C3.9 14 3 13.1 3 12Z"/><path d="M5 3C5 2.45 5.45 2 6 2C6 1.45 6.45 1 7 1C7 1.55 6.55 2 6 2C6 2.55 5.55 3 5 3Z"/><path d="M8 3C8 2.45 8.45 2 9 2C9 1.45 9.45 1 10 1C10 1.55 9.55 2 9 2C9 2.55 8.55 3 8 3Z"/></svg>,
  },
  {
    id: 'rest', label: 'Nghỉ ngơi',
    svg: <svg width="32" height="32" viewBox="0 0 18 16" fill="currentColor"><path d="M16 6H2C0.9 6 0 6.9 0 8V14C0 15.1 0.9 16 2 16H16C17.1 16 18 15.1 18 14V8C18 6.9 17.1 6 16 6ZM16 14H2V8H16V14Z"/><path d="M1 5H17V7H1V5Z"/><path d="M5 5C5 3.34 6.34 2 8 2H10C11.66 2 13 3.34 13 5H5Z"/></svg>,
  },
  {
    id: 'charge', label: 'Sạc pin',
    svg: <svg width="32" height="32" viewBox="0 0 16 20" fill="currentColor"><path d="M7 0V8H1L9 20V12H15L7 0Z"/></svg>,
  },
  {
    id: 'eyes', label: 'Nghỉ mắt',
    svg: <svg width="32" height="32" viewBox="0 0 20 14" fill="currentColor"><path d="M10 0C5.45 0 1.57 2.93 0 7C1.57 11.07 5.45 14 10 14C14.55 14 18.43 11.07 20 7C18.43 2.93 14.55 0 10 0ZM10 11.5C7.52 11.5 5.5 9.48 5.5 7C5.5 4.52 7.52 2.5 10 2.5C12.48 2.5 14.5 4.52 14.5 7C14.5 9.48 12.48 11.5 10 11.5ZM10 4.5C8.62 4.5 7.5 5.62 7.5 7C7.5 8.38 8.62 9.5 10 9.5C11.38 9.5 12.5 8.38 12.5 7C12.5 5.62 11.38 4.5 10 4.5Z"/></svg>,
  },
  {
    id: 'food', label: 'Ăn uống',
    svg: <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>,
  },
  {
    id: 'stretch', label: 'Giải trí',
    svg: <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/></svg>,
  },
  {
    id: 'bike', label: 'Đạp xe',
    svg: <svg width="32" height="32" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><circle cx="13" cy="3" r="1.5" fill="currentColor" stroke="none"/><path d="M7 4H11L14 9H8L7 4Z"/><path d="M8 9L4 12"/><path d="M14 9L16 12"/><path d="M11 3L14 9"/></svg>,
  },
  {
    id: 'meditate', label: 'Thiền',
    svg: <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="3" r="2"/><path d="M10 6C10 6 7 7 5 9C7 9 9 9.5 10 11C11 9.5 13 9 15 9C13 7 10 6 10 6Z"/><path d="M3 12C3 12 5 11 7 12L10 15L13 12C15 11 17 12 17 12C17 12 14 13 13 15L10 19L7 15C6 13 3 12 3 12Z"/></svg>,
  },
  {
    id: 'folder', label: 'Tài liệu',
    svg: <svg width="32" height="32" viewBox="0 0 20 18" fill="currentColor"><path d="M18 4H10L8 2H2C0.9 2 0 2.9 0 4V14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V6C20 4.9 19.1 4 18 4ZM18 14H2V4H7.17L9.17 6H18V14Z"/></svg>,
  },
];

// Helper dùng ở ReminderList để render SVG icon từ id
export function renderIconById(id: string, color = '#C2C6D6', size = 20): React.ReactNode {
  const found = ICONS.find(i => i.id === id);
  if (!found) return <span style={{ fontSize: size * 0.7 }}>🔔</span>;
  return (
    <div style={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${size / 28})` }}>
      {found.svg}
    </div>
  );
}

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
    const EMOJI_MAP: Record<string, string> = {
      '💧': 'water', '🏃': 'run', '✉️': 'email', '☕': 'coffee',
      '🧘': 'rest',  '⚡': 'charge', '👀': 'eyes', '🍎': 'food',
      '🚲': 'bike',  '🌈': 'meditate', '🎮': 'stretch', '📁': 'folder',
      '💉': 'water', '🎥': 'folder',
    };
    const iconVal = initial.config.icon;
    const matched = ICONS.find(i => i.id === iconVal)
      ?? ICONS.find(i => i.id === EMOJI_MAP[iconVal]);
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