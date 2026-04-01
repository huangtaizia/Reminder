import React from 'react';
import styles from './ReminderEditor.module.css';
import { TimeInput } from './TimeInput';

export function FixedTimePicker({ hour, minute, onHourChange, onMinuteChange }: {
  hour: number;
  minute: number;
  onHourChange: (v: number) => void;
  onMinuteChange: (v: number) => void;
}) {
  const ArrowBtn = ({ up, onClick }: { up: boolean; onClick: () => void }) => (
      <button
        type="button"
        onClick={onClick}
        className={styles.timeArrowBtn}
        aria-label={up ? 'Tăng giá trị thời gian' : 'Giảm giá trị thời gian'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {up ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}
        </svg>
      </button>
  );

  return (
    <div>
      <div className={styles.fixedPickerLabel}>Thời gian bắt đầu</div>
      <div className={styles.fixedPickerRow}>
        <div className={styles.fixedPickerCol}>
          <ArrowBtn up onClick={() => onHourChange(hour >= 23 ? 0 : hour + 1)} />
          <div className={styles.timeBox}>
            <TimeInput value={hour} max={23} onChange={onHourChange} />
          </div>
          <ArrowBtn up={false} onClick={() => onHourChange(hour <= 0 ? 23 : hour - 1)} />
        </div>
        <div className={styles.timeColon}>:</div>
        <div className={styles.fixedPickerCol}>
          <ArrowBtn up onClick={() => onMinuteChange(minute >= 59 ? 0 : minute + 1)} />
          <div className={styles.timeBox}>
            <TimeInput value={minute} max={59} onChange={onMinuteChange} />
          </div>
          <ArrowBtn up={false} onClick={() => onMinuteChange(minute <= 0 ? 59 : minute - 1)} />
        </div>
      </div>
      <div className={styles.fixedPickerHint}>
        Bắt đầu lúc {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
      </div>
    </div>
  );
}
