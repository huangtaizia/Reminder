import React from 'react';
import type { Reminder, ReminderSchedule } from '../../../shared/types';
import { ICONS, EMOJI_TO_ID } from '../reminderIcons';
import { DEFAULT_MESSAGE, nextOccurrenceAt } from './reminderEditorUtils';
import type { RepeatMode } from './reminderEditorTypes';

const COLOR = '#3b9eff';

export function useReminderEditorForm(initial?: Reminder | null, onSaved?: () => void) {
  const [message, setMessage] = React.useState('');
  const [iconId, setIconId] = React.useState(ICONS[0].id);
  const [intervalMin, setIntervalMin] = React.useState(30);
  const [displayMin, setDisplayMin] = React.useState(1);
  const [startHour, setStartHour] = React.useState(9);
  const [startMinute, setStartMinute] = React.useState(0);
  const [endHour, setEndHour] = React.useState(18);
  const [endMinute, setEndMinute] = React.useState(0);
  const [weekdays, setWeekdays] = React.useState<number[]>([1, 2, 3, 4, 5]);
  const [repeatMode, setRepeatMode] = React.useState<RepeatMode>('repeat');

  React.useEffect(() => {
    if (!initial) return;
    setMessage(initial.config.message);
    const iconVal = initial.config.icon;
    const matched = ICONS.find(i => i.id === iconVal)
      ?? ICONS.find(i => i.id === EMOJI_TO_ID[iconVal]);
    setIconId(matched ? matched.id : ICONS[0].id);
    setDisplayMin(Math.max(1, Math.round(initial.config.displayMs / 60_000)));
    if (initial.schedule.type === 'interval') {
      setIntervalMin(Math.max(1, Math.round(initial.schedule.intervalMs / 60_000)));
      setRepeatMode('repeat');
    } else if (initial.schedule.type === 'windowedInterval') {
      setIntervalMin(Math.max(1, Math.round(initial.schedule.intervalMs / 60_000)));
      setStartHour(Math.max(0, Math.min(23, initial.schedule.startHour)));
      setStartMinute(Math.max(0, Math.min(59, initial.schedule.startMinute)));
      setEndHour(Math.max(0, Math.min(23, initial.schedule.endHour)));
      setEndMinute(Math.max(0, Math.min(59, initial.schedule.endMinute)));
      setWeekdays(initial.schedule.weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6));
      setRepeatMode(initial.schedule.repeat ? 'repeat' : 'once');
    } else {
      setStartHour(initial.schedule.hour);
      setStartMinute(initial.schedule.minute);
      setEndHour(Math.min(23, initial.schedule.hour + 1));
      setEndMinute(initial.schedule.minute);
      setRepeatMode(initial.schedule.repeat === 'once' ? 'once' : 'repeat');
    }
  }, [initial]);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const timeRangeError = startTotal >= endTotal
    ? 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.'
    : '';
  const weekdaysError = weekdays.length === 0
    ? 'Vui lòng chọn ít nhất một thứ trong tuần.'
    : '';
  const canSave = !timeRangeError && !weekdaysError;

  const toggleWeekday = React.useCallback((day: number) => {
    setWeekdays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      return [...prev, day].sort((a, b) => a - b);
    });
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!canSave) return;
    const schedule: ReminderSchedule =
      {
        type: 'windowedInterval',
        intervalMs: Math.max(1, intervalMin) * 60_000,
        startHour: Math.max(0, Math.min(23, startHour)),
        startMinute: Math.max(0, Math.min(59, startMinute)),
        endHour: Math.max(0, Math.min(23, endHour)),
        endMinute: Math.max(0, Math.min(59, endMinute)),
        weekdays,
        repeat: repeatMode === 'repeat',
        onceAt: repeatMode === 'once'
          ? nextOccurrenceAt(Math.max(0, Math.min(23, startHour)), Math.max(0, Math.min(59, startMinute)))
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
    endHour,
    endMinute,
    iconId,
    initial,
    intervalMin,
    message,
    onSaved,
    repeatMode,
    startHour,
    startMinute,
    weekdays,
    canSave,
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
    intervalMin,
    setIntervalMin,
    displayMin,
    setDisplayMin,
    startHour,
    setStartHour,
    startMinute,
    setStartMinute,
    endHour,
    setEndHour,
    endMinute,
    setEndMinute,
    weekdays,
    setWeekdays,
    toggleWeekday,
    repeatMode,
    setRepeatMode,
    timeRangeError,
    weekdaysError,
    canSave,
    handleSave,
    handlePreview,
  };
}

export type ReminderEditorForm = ReturnType<typeof useReminderEditorForm>;
