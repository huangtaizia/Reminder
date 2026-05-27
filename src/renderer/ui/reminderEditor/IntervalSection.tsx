import React from 'react';
import styles from './ReminderEditor.module.css';

/** Phút — nhãn: 5p…30p, rồi 1h…4h */
const INTERVAL_PRESETS_MIN = [5, 10, 15, 30, 60, 120, 180, 240] as const;

function presetLabel(minutes: number): string {
  return minutes < 60 ? `${minutes}p` : `${minutes / 60}h`;
}

export function IntervalSection({
  intervalMin,
  setIntervalMin,
}: {
  intervalMin: number;
  setIntervalMin: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div>
      <div className={styles.intervalLabel}>Lặp lại mỗi (phút)</div>
      <div className={styles.intervalRow}>
        <button
          type="button"
          className={styles.intervalStepBtn}
          onClick={() => setIntervalMin(v => Math.max(1, v - 1))}
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={1440}
          value={intervalMin}
          className={styles.intervalInput}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) setIntervalMin(Math.max(1, Math.min(1440, v)));
          }}
        />
        <button
          type="button"
          className={styles.intervalStepBtn}
          onClick={() => setIntervalMin(v => Math.min(1440, v + 1))}
        >
          +
        </button>
      </div>
      <div className={styles.intervalChips}>
        {INTERVAL_PRESETS_MIN.map((v) => (
          <button
            key={v}
            type="button"
            className={`${styles.intervalChip} ${intervalMin === v ? styles.intervalChipActive : ''}`}
            onClick={() => setIntervalMin(v)}
          >
            {presetLabel(v)}
          </button>
        ))}
      </div>
    </div>
  );
}
