import React from 'react';
import styles from './ReminderEditor.module.css';
import { CustomDropdown } from './CustomDropdown';
import { IntervalSection } from './IntervalSection';
import { DisplayDurationSlider } from './DisplayDurationSlider';
import { TimeInput } from './TimeInput';
import type { RepeatMode } from './reminderEditorTypes';
import type { ReminderEditorForm } from './useReminderEditorForm';

export function ReminderEditorRightColumn({ form }: { form: ReminderEditorForm }) {
  const {
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
    toggleWeekday,
    repeatMode,
    setRepeatMode,
    timeRangeError,
    weekdaysError,
    canSave,
    handleSave,
    handlePreview,
  } = form;
  const weekOptions = [
    { value: 1, label: 'T2' },
    { value: 2, label: 'T3' },
    { value: 3, label: 'T4' },
    { value: 4, label: 'T5' },
    { value: 5, label: 'T6' },
    { value: 6, label: 'T7' },
    { value: 0, label: 'CN' },
  ];

  return (
    <div className={styles.rightCol}>
      <div className={styles.rightPanel}>
        <div className={styles.sectionLabelTight}>Thiết lập thời gian</div>

        <div className={styles.scrollArea}>
          <div>
            <div className={styles.fieldLabel}>Chế độ lặp</div>
            <CustomDropdown<RepeatMode>
              value={repeatMode}
              onChange={setRepeatMode}
              options={[
                { value: 'repeat', label: 'Lặp lại theo lịch' },
                { value: 'once', label: 'Chỉ chạy 1 lần rồi tắt' },
              ]}
            />
          </div>

          {repeatMode === 'repeat' ? (
            <div>
              <IntervalSection intervalMin={intervalMin} setIntervalMin={setIntervalMin} />
            </div>
          ) : null}

          <div className={styles.fixedBlock}>
            <div>
              <div className={styles.fieldLabel}>Khung giờ hoạt động</div>
              <div className={styles.timeRangeRow}>
                <div className={styles.timeInline}>
                  <span className={styles.timeInlineLabel}>Bắt đầu</span>
                  <div className={styles.timeMiniBox}>
                    <TimeInput value={startHour} max={23} onChange={setStartHour} />
                    <span className={styles.timeColonSmall}>:</span>
                    <TimeInput value={startMinute} max={59} onChange={setStartMinute} />
                  </div>
                </div>
                <div className={styles.timeInline}>
                  <span className={styles.timeInlineLabel}>Kết thúc</span>
                  <div className={styles.timeMiniBox}>
                    <TimeInput value={endHour} max={23} onChange={setEndHour} />
                    <span className={styles.timeColonSmall}>:</span>
                    <TimeInput value={endMinute} max={59} onChange={setEndMinute} />
                  </div>
                </div>
              </div>
              {timeRangeError ? <div className={styles.inlineError}>{timeRangeError}</div> : null}
            </div>

            <div>
              <div className={styles.fieldLabel}>Thứ trong tuần</div>
              <div className={styles.weekdayGrid}>
                {weekOptions.map((w) => {
                  const active = weekdays.includes(w.value);
                  return (
                    <button
                      key={w.value}
                      type="button"
                      className={`${styles.weekdayChip} ${active ? styles.weekdayChipActive : ''}`}
                      onClick={() => toggleWeekday(w.value)}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
              {weekdaysError ? <div className={styles.inlineError}>{weekdaysError}</div> : null}
            </div>
          </div>

          <DisplayDurationSlider displayMin={displayMin} setDisplayMin={setDisplayMin} />
        </div>

        <div className={styles.footer}>
          <button type="button" className={`btn ${styles.footerBtn} ${styles.footerBtnPreview}`} onClick={handlePreview}>
            <svg width="13" height="13" viewBox="0 0 20 14" fill="currentColor" className={styles.btnIcon}>
              <path d="M10 0C5.45 0 1.57 2.93 0 7C1.57 11.07 5.45 14 10 14C14.55 14 18.43 11.07 20 7C18.43 2.93 14.55 0 10 0ZM10 11.5C7.52 11.5 5.5 9.48 5.5 7C5.5 4.52 7.52 2.5 10 2.5C12.48 2.5 14.5 4.52 14.5 7C14.5 9.48 12.48 11.5 10 11.5ZM10 4.5C8.62 4.5 7.5 5.62 7.5 7C7.5 8.38 8.62 9.5 10 9.5C11.38 9.5 12.5 8.38 12.5 7C12.5 5.62 11.38 4.5 10 4.5Z" />
            </svg>
            Xem trước
          </button>
          <button type="button" className={`btn primary ${styles.footerBtn} ${styles.footerBtnSave}`} onClick={handleSave} disabled={!canSave}>
            <svg width="13" height="13" viewBox="0 0 11 11" fill="currentColor" className={styles.btnIcon}>
              <path d="M9 0H2C0.9 0 0 0.9 0 2V9C0 10.1 0.9 11 2 11H9C10.1 11 11 10.1 11 9V2L9 0ZM5.5 9.5C4.12 9.5 3 8.38 3 7C3 5.62 4.12 4.5 5.5 4.5C6.88 4.5 8 5.62 8 7C8 8.38 6.88 9.5 5.5 9.5ZM7 3H2V1H7V3Z" />
            </svg>
            Lưu lại
          </button>
        </div>
      </div>
    </div>
  );
}
