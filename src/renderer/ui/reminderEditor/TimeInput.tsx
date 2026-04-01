import React from 'react';
import styles from './ReminderEditor.module.css';

export function TimeInput({ value, max, onChange }: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const [raw, setRaw] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const display = focused ? raw : String(value).padStart(2, '0');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9]/g, '');
    if (input === '') { setRaw(''); onChange(0); return; }
    const trimmed = input.slice(-2);
    const num = parseInt(trimmed, 10);
    if (num <= max) {
      setRaw(trimmed);
      onChange(num);
    } else {
      const last = parseInt(input.slice(-1), 10);
      setRaw(String(last).padStart(2, '0'));
      onChange(last);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onFocus={() => { setFocused(true); setRaw(''); }}
      onBlur={() => { setFocused(false); setRaw(''); }}
      maxLength={2}
      className={styles.timeInput}
    />
  );
}
