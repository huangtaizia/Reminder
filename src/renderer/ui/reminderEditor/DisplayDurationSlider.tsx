import React from 'react';
import styles from './ReminderEditor.module.css';

const TICKS = ['1M', '30M', '60M'] as const;

export function DisplayDurationSlider({
  displayMin,
  setDisplayMin,
}: {
  displayMin: number;
  setDisplayMin: React.Dispatch<React.SetStateAction<number>>;
}) {
  const pct = (displayMin / 60) * 100;
  return (
    <div className={styles.durationBlock}>
      <div className={styles.durationHeader}>
        <span className={styles.durationLabel}>Thời gian tồn tại</span>
        <span className={styles.durationValue}>{displayMin} Phút</span>
      </div>
      <div className={styles.sliderTrack}>
        <div className={styles.sliderFill} style={{ width: `${pct}%` }} />
        <div className={styles.sliderThumb} style={{ left: `${pct}%` }} />
        <input
          type="range"
          min={1}
          max={60}
          value={displayMin}
          className={styles.sliderInput}
          onChange={(e) => setDisplayMin(Number(e.target.value))}
        />
      </div>
      <div className={styles.durationTicks}>
        {TICKS.map((l) => (
          <span key={l} className={styles.durationTick}>{l}</span>
        ))}
      </div>
    </div>
  );
}
