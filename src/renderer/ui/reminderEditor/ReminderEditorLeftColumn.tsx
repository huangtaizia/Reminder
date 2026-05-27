import React from 'react';
import { ICONS } from '../reminderIcons';
import styles from './ReminderEditor.module.css';

export function ReminderEditorLeftColumn({
  message,
  setMessage,
  iconId,
  setIconId,
}: {
  message: string;
  setMessage: (v: string) => void;
  iconId: string;
  setIconId: (id: string) => void;
}) {
  return (
    <div className={styles.leftCol}>
      <div className={styles.panel}>
        <div className={styles.sectionLabel}>Thông điệp nhắc nhở</div>
        <textarea
          className={styles.messageTextarea}
          placeholder="Nhập nội dung nhắc nhở tại đây..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.sectionLabel}>Biểu tượng</div>
        <div className={`${styles.iconGrid} ${styles.iconGridEditor}`}>
          {ICONS.map((ic) => {
            const active = iconId === ic.id;
            return (
              <div
                key={ic.id}
                role="button"
                tabIndex={0}
                onClick={() => setIconId(ic.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIconId(ic.id);
                  }
                }}
                className={`${styles.iconChip} ${active ? styles.iconChipActive : ''}`}
              >
                <div className={styles.iconChipSvg}>{ic.svg}</div>
                <span className={styles.iconChipText}>{ic.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
