import React from 'react';
import type { Reminder, ReminderSchedule } from '../../shared/types';

type ScheduleType = 'interval' | 'fixed';

const DEFAULT_MESSAGE = 'Thông điệp nhắc nhở';

export const ICONS: { id: string; label: string; svg: React.ReactNode }[] = [
  {
    id: 'water', label: 'Uống nước',
    svg: <svg width="24" height="28" viewBox="0 0 16 20" fill="currentColor"><path d="M8 0L1 8C1 12.42 4.13 16 8 16C11.87 16 15 12.42 15 8L8 0ZM8 14.5C5 14.5 2.5 11.84 2.5 8.5L8 2.1L13.5 8.5C13.5 11.84 11 14.5 8 14.5Z"/><path d="M4.5 9.5C4.5 11.43 6.07 13 8 13V11.5C6.9 11.5 6 10.6 6 9.5H4.5Z"/></svg>,
  },
  {
    id: 'run', label: 'Vận động',
    svg: <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor"><circle cx="13" cy="2.5" r="1.5"/><path d="M10.5 7.5L8 6L5 7.5V10H7V8.5L9 7.5L7.5 13H9.5L10.5 10L13 12V15H15V11.5L12.5 9.5L13.5 7.5H16V5.5H12.5L10.5 7.5Z"/><path d="M7 13.5L5 18H7L8.5 14.5L7 13.5Z"/><path d="M11 14L9.5 18H11.5L13 14H11Z"/></svg>,
  },
  {
    id: 'email', label: 'Ghi email',
    svg: <svg width="28" height="22" viewBox="0 0 20 16" fill="currentColor"><path d="M18 0H2C0.9 0 0 0.9 0 2V14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0ZM18 4L10 9L2 4V2L10 7L18 2V4Z"/></svg>,
  },
  {
    id: 'coffee', label: 'Uống cafe',
    svg: <svg width="26" height="26" viewBox="0 0 18 18" fill="currentColor"><path d="M14 6H2V12C2 13.66 3.34 15 5 15H11C12.66 15 14 13.66 14 12V11H15C16.1 11 17 10.1 17 9C17 7.9 16.1 7 15 7H14V6ZM15 9H14V8H15C15.55 8 16 8.45 16 9C16 9.55 15.55 10 15 10V9ZM3 12V7H13V12C13 13.1 12.1 14 11 14H5C3.9 14 3 13.1 3 12Z"/><path d="M5 3C5 2.45 5.45 2 6 2C6 1.45 6.45 1 7 1C7 1.55 6.55 2 6 2C6 2.55 5.55 3 5 3Z"/><path d="M8 3C8 2.45 8.45 2 9 2C9 1.45 9.45 1 10 1C10 1.55 9.55 2 9 2C9 2.55 8.55 3 8 3Z"/></svg>,
  },
  {
    id: 'rest', label: 'Nghỉ ngơi',
    svg: <svg width="26" height="24" viewBox="0 0 18 16" fill="currentColor"><path d="M16 6H2C0.9 6 0 6.9 0 8V14C0 15.1 0.9 16 2 16H16C17.1 16 18 15.1 18 14V8C18 6.9 17.1 6 16 6ZM16 14H2V8H16V14Z"/><path d="M1 5H17V7H1V5Z"/><path d="M5 5C5 3.34 6.34 2 8 2H10C11.66 2 13 3.34 13 5H5Z"/></svg>,
  },
  {
    id: 'charge', label: 'Sạc pin',
    svg: <svg width="22" height="28" viewBox="0 0 16 20" fill="currentColor"><path d="M7 0V8H1L9 20V12H15L7 0Z"/></svg>,
  },
  {
    id: 'eyes', label: 'Nghỉ mắt',
    svg: <svg width="28" height="20" viewBox="0 0 20 14" fill="currentColor"><path d="M10 0C5.45 0 1.57 2.93 0 7C1.57 11.07 5.45 14 10 14C14.55 14 18.43 11.07 20 7C18.43 2.93 14.55 0 10 0ZM10 11.5C7.52 11.5 5.5 9.48 5.5 7C5.5 4.52 7.52 2.5 10 2.5C12.48 2.5 14.5 4.52 14.5 7C14.5 9.48 12.48 11.5 10 11.5ZM10 4.5C8.62 4.5 7.5 5.62 7.5 7C7.5 8.38 8.62 9.5 10 9.5C11.38 9.5 12.5 8.38 12.5 7C12.5 5.62 11.38 4.5 10 4.5Z"/></svg>,
  },
  {
    id: 'food', label: 'Ăn uống',
    svg: <svg width="26" height="26" viewBox="0 0 18 18" fill="currentColor"><path d="M9 1C4.58 1 1 4.58 1 9C1 13.42 4.58 17 9 17C13.42 17 17 13.42 17 9C17 4.58 13.42 1 9 1ZM9 15.5C5.41 15.5 2.5 12.59 2.5 9C2.5 5.41 5.41 2.5 9 2.5C12.59 2.5 15.5 5.41 15.5 9C15.5 12.59 12.59 15.5 9 15.5Z"/><path d="M9 5C7.34 5 6 6.34 6 8H12C12 6.34 10.66 5 9 5Z"/><path d="M6 9V11C6 12.66 7.34 14 9 14C10.66 14 12 12.66 12 11V9H6Z"/></svg>,
  },
  {
    id: 'stretch', label: 'Giãn cơ',
    svg: <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="3" r="2"/><path d="M14 8H10.5L9 5.5L5 8L6.5 9.5L9 8L10 10L7 13L5 19H7L9 14L10 12L11 14L13 19H15L13 13L15 10L17 12L19 10L14 8Z"/></svg>,
  },
  {
    id: 'bike', label: 'Đạp xe',
    svg: <svg width="28" height="22" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><circle cx="13" cy="3" r="1.5" fill="currentColor" stroke="none"/><path d="M7 4H11L14 9H8L7 4Z"/><path d="M8 9L4 12"/><path d="M14 9L16 12"/><path d="M11 3L14 9"/></svg>,
  },
  {
    id: 'meditate', label: 'Thiền',
    svg: <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="3" r="2"/><path d="M10 6C10 6 7 7 5 9C7 9 9 9.5 10 11C11 9.5 13 9 15 9C13 7 10 6 10 6Z"/><path d="M3 12C3 12 5 11 7 12L10 15L13 12C15 11 17 12 17 12C17 12 14 13 13 15L10 19L7 15C6 13 3 12 3 12Z"/></svg>,
  },
  {
    id: 'folder', label: 'Tài liệu',
    svg: <svg width="28" height="24" viewBox="0 0 20 18" fill="currentColor"><path d="M18 4H10L8 2H2C0.9 2 0 2.9 0 4V14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V6C20 4.9 19.1 4 18 4ZM18 14H2V4H7.17L9.17 6H18V14Z"/></svg>,
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
          background: '#222A3D', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: '#DAE2FD', fontSize: 14,
          outline: 'none', fontFamily: 'inherit',
        }}
      />
      <div style={btn} onClick={disabled ? undefined : () => onChange(Math.min(max, value + step))}>+</div>
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
    const matched = ICONS.find(i => i.id === initial.config.icon);
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

  const panel: React.CSSProperties = { background: '#131B2E', borderRadius: 16, padding: 24 };
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
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>

        {/* Thông điệp */}
        <div style={panel}>
          <div style={sectionLabel}>Thông điệp nhắc nhở</div>
          <textarea
            style={{
              width: '100%', minHeight: 160, boxSizing: 'border-box',
              background: '#222A3D', border: 'none', borderRadius: 12,
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
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
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
                    gap: 10, borderRadius: 14, cursor: 'pointer',
                    background: active ? '#2D3449' : '#222A3D',
                    boxShadow: active ? '0 0 0 1.5px #ADC6FF' : 'none',
                    transition: 'background 0.15s, box-shadow 0.15s',
                    padding: '12px 8px',
                  }}
                >
                  <div style={{ color: active ? '#ADC6FF' : '#C2C6D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic.svg}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
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
      <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', padding: '28px 24px 28px 20px', display: 'flex', flexDirection: 'column' }}>
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
            <div>
              <div style={{ fontSize: 14, color: '#C2C6D6', marginBottom: 8 }}>Thời gian bắt đầu</div>
              <div style={{ background: '#222A3D', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="number" min={0} max={23} value={fixedHour}
                  onChange={e => setFixedHour(Math.max(0, Math.min(23, Number(e.target.value))))}
                  style={{ width: 44, background: 'transparent', border: 'none', color: '#DAE2FD', fontSize: 16, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                />
                <span style={{ color: '#DAE2FD', opacity: 0.5, fontWeight: 700 }}>:</span>
                <input type="number" min={0} max={59} value={fixedMinute}
                  onChange={e => setFixedMinute(Math.max(0, Math.min(59, Number(e.target.value))))}
                  style={{ width: 44, background: 'transparent', border: 'none', color: '#DAE2FD', fontSize: 16, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          )}

          {/* Interval */}
          {scheduleType === 'interval' && (
            <div>
              <div style={{ fontSize: 14, color: '#C2C6D6', marginBottom: 8 }}>Tần suất lặp lại</div>
              <div style={{ background: '#222A3D', borderRadius: 12, padding: '0 12px' }}>
                <select value={intervalMin} onChange={e => setIntervalMin(Number(e.target.value))}
                  style={{ width: '100%', height: 48, background: 'transparent', border: 'none', color: '#DAE2FD', fontSize: 15, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', appearance: 'none' }}>
                  <option value={15}>Mỗi 15 phút</option>
                  <option value={30}>Mỗi 30 phút</option>
                  <option value={60}>Mỗi 1 giờ</option>
                  <option value={120}>Mỗi 2 giờ</option>
                  <option value={180}>Mỗi 3 giờ</option>
                  <option value={240}>Mỗi 4 giờ</option>
                </select>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button className="btn" onClick={handlePreview} style={{
              width: '100%', height: 42, borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid #424754',
              color: '#DAE2FD', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="11" viewBox="0 0 20 14" fill="#DAE2FD">
                <path d="M10 0C5.45 0 1.57 2.93 0 7C1.57 11.07 5.45 14 10 14C14.55 14 18.43 11.07 20 7C18.43 2.93 14.55 0 10 0ZM10 11.5C7.52 11.5 5.5 9.48 5.5 7C5.5 4.52 7.52 2.5 10 2.5C12.48 2.5 14.5 4.52 14.5 7C14.5 9.48 12.48 11.5 10 11.5ZM10 4.5C8.62 4.5 7.5 5.62 7.5 7C7.5 8.38 8.62 9.5 10 9.5C11.38 9.5 12.5 8.38 12.5 7C12.5 5.62 11.38 4.5 10 4.5Z"/>
              </svg>
              Xem trước
            </button>
            <button className='btn primary' onClick={handleSave} style={{
              width: '100%', height: 42, borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(104.36deg, #ADC6FF 0%, #4D8EFF 100%)',
              boxShadow: '0 0 20px rgba(173,198,255,0.3)',
              border: 'none', color: '#002E6A', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 11 11" fill="#002E6A">
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