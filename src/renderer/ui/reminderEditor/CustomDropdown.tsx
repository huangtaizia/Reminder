import React from 'react';
import styles from './ReminderEditor.module.css';

export function CustomDropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDocMouseDown = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const current = options.find(o => o.value === value) ?? options[0];

  return (
    <div ref={rootRef} className={styles.dropdownRoot}>
      <button type="button" className={styles.dropdownTrigger} onClick={() => setOpen(v => !v)}>
        <span>{current?.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(173,198,255,0.55)" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={`${styles.dropdownMenu} ${open ? styles.dropdownMenuOpen : ''}`}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`${styles.dropdownOption} ${active ? styles.dropdownOptionActive : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
