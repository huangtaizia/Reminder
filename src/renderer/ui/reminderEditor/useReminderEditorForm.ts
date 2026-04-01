import React from 'react';
import type { Reminder, ReminderSchedule } from '../../../shared/types';
import { ICONS, EMOJI_TO_ID } from '../reminderIcons';
import { DEFAULT_MESSAGE, nextOccurrenceAt } from './reminderEditorUtils';
import type { FixedRepeatMode, ScheduleType } from './reminderEditorTypes';

const COLOR = '#3b9eff';

export function useReminderEditorForm(initial?: Reminder | null, onSaved?: () => void) {
  const [message, setMessage] = React.useState('');
  const [iconId, setIconId] = React.useState(ICONS[0].id);
  const [scheduleType, setScheduleType] = React.useState<ScheduleType>('interval');
  const [intervalMin, setIntervalMin] = React.useState(30);
  const [displayMin, setDisplayMin] = React.useState(1);
  const [fixedHour, setFixedHour] = React.useState(9);
  const [fixedMinute, setFixedMinute] = React.useState(0);
  const [fixedRepeat, setFixedRepeat] = React.useState<FixedRepeatMode>('daily');

  React.useEffect(() => {
    if (!initial) return;
    setMessage(initial.config.message);
    const iconVal = initial.config.icon;
    const matched = ICONS.find(i => i.id === iconVal)
      ?? ICONS.find(i => i.id === EMOJI_TO_ID[iconVal]);
    setIconId(matched ? matched.id : ICONS[0].id);
    setDisplayMin(Math.max(1, Math.round(initial.config.displayMs / 60_000)));
    if (initial.schedule.type === 'interval') {
      setScheduleType('interval');
      setIntervalMin(Math.max(1, Math.round(initial.schedule.intervalMs / 60_000)));
    } else {
      setScheduleType('fixed');
      setFixedHour(initial.schedule.hour);
      setFixedMinute(initial.schedule.minute);
      setFixedRepeat(initial.schedule.repeat === 'once' ? 'once' : 'daily');
    }
  }, [initial]);

  const handleSave = React.useCallback(async () => {
    const schedule: ReminderSchedule =
      scheduleType === 'interval'
        ? { type: 'interval', intervalMs: Math.max(1, intervalMin) * 60_000 }
        : {
            type: 'fixedDaily',
            hour: Math.max(0, Math.min(23, fixedHour)),
            minute: Math.max(0, Math.min(59, fixedMinute)),
            repeat: fixedRepeat,
            onceAt: fixedRepeat === 'once'
              ? nextOccurrenceAt(Math.max(0, Math.min(23, fixedHour)), Math.max(0, Math.min(59, fixedMinute)))
              : undefined,
          };
    await window.reminder.upsertReminder({
      id: initial?.id,
      createdAt: initial?.createdAt,
      enabled: initial?.enabled ?? true,
      schedule,
      config: {
        icon: iconId,
        color: COLOR,
        message: message.trim() || DEFAULT_MESSAGE,
        displayMs: Math.max(1, Math.min(24 * 60, displayMin)) * 60_000,
      },
    } as any);
    if (!initial) setMessage('');
    onSaved?.();
  }, [
    displayMin,
    fixedHour,
    fixedMinute,
    fixedRepeat,
    iconId,
    initial,
    intervalMin,
    message,
    onSaved,
    scheduleType,
  ]);

  const handlePreview = React.useCallback(async () => {
    await window.reminder.previewPopup({
      icon: iconId,
      color: COLOR,
      message: message.trim() || DEFAULT_MESSAGE,
      displayMs: Math.max(1, Math.min(24 * 60, displayMin)) * 60_000,
    });
  }, [displayMin, iconId, message]);

  return {
    message,
    setMessage,
    iconId,
    setIconId,
    scheduleType,
    setScheduleType,
    intervalMin,
    setIntervalMin,
    displayMin,
    setDisplayMin,
    fixedHour,
    setFixedHour,
    fixedMinute,
    setFixedMinute,
    fixedRepeat,
    setFixedRepeat,
    handleSave,
    handlePreview,
  };
}

export type ReminderEditorForm = ReturnType<typeof useReminderEditorForm>;
