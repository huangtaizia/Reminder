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
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  React.useEffect(() => {
    const onDocMouseDown = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const current = options.find(o => o.value === value) ?? options[0];

  const clampIndex = (i: number) => {
    const max = Math.max(0, options.length - 1);
    return Math.max(0, Math.min(max, i));
  };

  const focusOption = React.useCallback((idx: number) => {
    const i = clampIndex(idx);
    const el = optionRefs.current[i];
    if (el) el.focus();
  }, [options.length]);

  const openAndFocus = React.useCallback((idx: number) => {
    setOpen(true);
    // Wait for menu/options to be in DOM.
    queueMicrotask(() => focusOption(idx));
  }, [focusOption]);

  return (
    <div
      ref={rootRef}
      className={styles.dropdownRoot}
      onBlurCapture={(e) => {
        const next = e.relatedTarget as Node | null;
        // Close when focus leaves the dropdown.
        if (open && rootRef.current && (!next || !rootRef.current.contains(next))) setOpen(false);
      }}
      onKeyDownCapture={(e) => {
        if (e.key === 'Tab' && open) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.dropdownTrigger}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            openAndFocus(0);
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            openAndFocus(options.length - 1);
            return;
          }
          if (e.key === 'Escape' && open) {
            e.preventDefault();
            setOpen(false);
          }
        }}
      >
        <span>{current?.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(173,198,255,0.55)" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={`${styles.dropdownMenu} ${open ? styles.dropdownMenuOpen : ''}`}>
        {options.map((opt, idx) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`${styles.dropdownOption} ${active ? styles.dropdownOptionActive : ''}`}
              // Keep options out of tab order. Navigation inside the menu uses Arrow keys.
              tabIndex={-1}
              ref={(el) => { optionRefs.current[idx] = el; }}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  focusOption(idx + 1);
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  focusOption(idx - 1);
                  return;
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setOpen(false);
                  triggerRef.current?.focus();
                  return;
                }
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(opt.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
