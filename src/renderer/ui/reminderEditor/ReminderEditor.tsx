import React from 'react';
import type { Reminder } from '../../../shared/types';
import { useReminderEditorForm } from './useReminderEditorForm';
import { ReminderEditorLeftColumn } from './ReminderEditorLeftColumn';
import { ReminderEditorRightColumn } from './ReminderEditorRightColumn';
import styles from './ReminderEditor.module.css';

export function ReminderEditor({ initial, onSaved }: { initial?: Reminder | null; onSaved?: () => void }) {
  const form = useReminderEditorForm(initial, onSaved);

  return (
    <div className={styles.root}>
      <ReminderEditorLeftColumn
        message={form.message}
        setMessage={form.setMessage}
        iconId={form.iconId}
        setIconId={form.setIconId}
      />
      <ReminderEditorRightColumn form={form} />
    </div>
  );
}
