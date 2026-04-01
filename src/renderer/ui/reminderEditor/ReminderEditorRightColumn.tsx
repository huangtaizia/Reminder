import React from 'react';
import styles from './ReminderEditor.module.css';
import { CustomDropdown } from './CustomDropdown';
import { FixedTimePicker } from './FixedTimePicker';
import { IntervalSection } from './IntervalSection';
import { DisplayDurationSlider } from './DisplayDurationSlider';
import type { FixedRepeatMode, ScheduleType } from './reminderEditorTypes';
import type { ReminderEditorForm } from './useReminderEditorForm';

export function ReminderEditorRightColumn({ form }: { form: ReminderEditorForm }) {
  const {
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
  } = form;

  return (
    <div className={styles.rightCol}>
      <div className={styles.rightPanel}>
        <div className={styles.sectionLabelTight}>Thiết lập thời gian</div>

        <div className={styles.scrollArea}>
          <div>
            <div className={styles.fieldLabel}>Chọn loại nhắc nhở</div>
            <CustomDropdown<ScheduleType>
              value={scheduleType}
              onChange={setScheduleType}
              options={[
                { value: 'interval', label: 'Lặp lại theo chu kỳ' },
                { value: 'fixed', label: 'Theo giờ cố định' },
              ]}
            />
          </div>

          {scheduleType === 'fixed' && (
            <div className={styles.fixedBlock}>
              <FixedTimePicker
                hour={fixedHour}
                minute={fixedMinute}
                onHourChange={setFixedHour}
                onMinuteChange={setFixedMinute}
              />
              <div>
                <div className={styles.fieldLabel}>Tần suất lặp lại</div>
                <CustomDropdown<FixedRepeatMode>
                  value={fixedRepeat}
                  onChange={setFixedRepeat}
                  options={[
                    { value: 'once', label: 'Một lần duy nhất' },
                    { value: 'daily', label: 'Hằng ngày' },
                  ]}
                />
              </div>
            </div>
          )}

          {scheduleType === 'interval' && (
            <IntervalSection intervalMin={intervalMin} setIntervalMin={setIntervalMin} />
          )}

          <DisplayDurationSlider displayMin={displayMin} setDisplayMin={setDisplayMin} />
        </div>

        <div className={styles.footer}>
          <button type="button" className={`btn ${styles.footerBtn} ${styles.footerBtnPreview}`} onClick={handlePreview}>
            <svg width="13" height="13" viewBox="0 0 20 14" fill="currentColor" className={styles.btnIcon}>
              <path d="M10 0C5.45 0 1.57 2.93 0 7C1.57 11.07 5.45 14 10 14C14.55 14 18.43 11.07 20 7C18.43 2.93 14.55 0 10 0ZM10 11.5C7.52 11.5 5.5 9.48 5.5 7C5.5 4.52 7.52 2.5 10 2.5C12.48 2.5 14.5 4.52 14.5 7C14.5 9.48 12.48 11.5 10 11.5ZM10 4.5C8.62 4.5 7.5 5.62 7.5 7C7.5 8.38 8.62 9.5 10 9.5C11.38 9.5 12.5 8.38 12.5 7C12.5 5.62 11.38 4.5 10 4.5Z" />
            </svg>
            Xem trước
          </button>
          <button type="button" className={`btn primary ${styles.footerBtn} ${styles.footerBtnSave}`} onClick={handleSave}>
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
