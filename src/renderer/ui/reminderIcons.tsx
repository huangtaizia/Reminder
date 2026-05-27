import React from 'react';

export type ReminderIcon = {
  id: string;
  label: string;
  svg: React.ReactNode;
};

export const ICONS: ReminderIcon[] = [
  {
    id: 'water', label: 'Uống nước',
    svg: <svg width="32" height="32" viewBox="0 0 16 20" fill="currentColor"><path d="M8 0L1 8C1 12.42 4.13 16 8 16C11.87 16 15 12.42 15 8L8 0ZM8 14.5C5 14.5 2.5 11.84 2.5 8.5L8 2.1L13.5 8.5C13.5 11.84 11 14.5 8 14.5Z"/><path d="M4.5 9.5C4.5 11.43 6.07 13 8 13V11.5C6.9 11.5 6 10.6 6 9.5H4.5Z"/></svg>,
  },
  {
    id: 'run', label: 'Vận động',
    svg: <svg width="32" height="32" viewBox="0 0 90 82" fill="currentColor"><path d="M42.918 50.129c-1.144 0-2.277-.497-3.054-1.454-1.367-1.685-1.108-4.159.577-5.526l22.419-18.18c1.685-1.364 4.159-1.108 5.526.577 1.366 1.686 1.108 4.159-.577 5.526L45.39 49.251c-.728.591-1.603.878-2.472.878z"/><path d="M71.946 43.083c-1.343 0-2.648-.69-3.381-1.924l-6.608-11.133c-1.108-1.865-.493-4.276 1.372-5.383 1.866-1.107 4.277-.492 5.383 1.373l4.664 7.857 10.793-5.967c1.9-1.05 4.289-.361 5.339 1.537 1.049 1.899.362 4.289-1.537 5.339l-14.128 7.81c-.605.333-1.257.491-1.897.491z"/><path d="M38.608 34.788c-1.203 0-2.391-.551-3.161-1.593-1.29-1.744-.922-4.204.822-5.494l11.837-8.758c1.092-.808 2.525-.995 3.787-.492l14.893 5.92c2.016.801 3.001 3.085 2.199 5.102-.801 2.017-3.086 3-5.101 2.2l-12.862-5.112-10.08 7.458c-.703.569-1.522.769-2.334.769z"/><circle cx="76.622" cy="19.962" r="6.782"/><path d="M20.115 74.459c-1.237 0-2.455-.582-3.219-1.673-1.246-1.776-.816-4.226.96-5.472l15.626-10.962 5.916-11.901c.966-1.943 3.325-2.733 5.266-1.77 1.943.966 2.735 3.324 1.77 5.266l-6.36 12.795c-.292.587-.726 1.091-1.262 1.467L22.368 73.746c-.687.482-1.474.713-2.253.713z"/><path d="M57.856 56.365c-.504 0-1.017-.098-1.511-.304l-14.943-6.235c-2.002-.835-2.948-3.136-2.112-5.138.836-2.002 3.137-2.946 5.138-2.112L59.37 48.81c2.003.835 2.948 3.136 2.113 5.138-.629 1.507-2.089 2.417-3.627 2.417z"/><path d="M50.014 76.82c-.467 0-.943-.083-1.405-.261-2.026-.777-3.039-3.049-2.262-5.075l7.842-20.456c.777-2.026 3.048-3.04 5.075-2.263s3.038 3.049 2.263 5.075l-7.843 20.456c-.629 1.564-2.119 2.524-3.67 2.524z"/><path d="M31.603 45.981H1.964C.879 45.981 0 45.102 0 44.017c0-1.085.879-1.964 1.964-1.964h29.639c1.085 0 1.964.879 1.964 1.964 0 1.085-.88 1.964-1.964 1.964z"/><path d="M27.581 35.524H9.204c-1.085 0-1.964-.879-1.964-1.964s.879-1.964 1.964-1.964h18.377c1.085 0 1.964.879 1.964 1.964s-.879 1.964-1.964 1.964z"/><path d="M25.168 56.438H9.204c-1.085 0-1.964-.879-1.964-1.964s.879-1.964 1.964-1.964h15.964c1.085 0 1.964.879 1.964 1.964s-.879 1.964-1.964 1.964z"/></svg>,
  },
  {
    id: 'email', label: 'Gửi email',
    svg: <svg width="32" height="32" viewBox="0 0 20 16" fill="currentColor"><path d="M18 0H2C0.9 0 0 0.9 0 2V14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0ZM18 4L10 9L2 4V2L10 7L18 2V4Z"/></svg>,
  },
  {
    id: 'coffee', label: 'Uống cafe',
    svg: <svg width="32" height="32" viewBox="0 0 18 18" fill="currentColor"><path d="M14 6H2V12C2 13.66 3.34 15 5 15H11C12.66 15 14 13.66 14 12V11H15C16.1 11 17 10.1 17 9C17 7.9 16.1 7 15 7H14V6ZM15 9H14V8H15C15.55 8 16 8.45 16 9C16 9.55 15.55 10 15 10V9ZM3 12V7H13V12C13 13.1 12.1 14 11 14H5C3.9 14 3 13.1 3 12Z"/><path d="M5 3C5 2.45 5.45 2 6 2C6 1.45 6.45 1 7 1C7 1.55 6.55 2 6 2C6 2.55 5.55 3 5 3Z"/><path d="M8 3C8 2.45 8.45 2 9 2C9 1.45 9.45 1 10 1C10 1.55 9.55 2 9 2C9 2.55 8.55 3 8 3Z"/></svg>,
  },
  {
    id: 'rest', label: 'Nghỉ ngơi',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    id: 'charge', label: 'Nhắc khéo',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
        <path d="M7 10h2v2H7zm0-4h2v2H7zm0 8h2v2H7zm4-8h10v2H11zm0 4h10v2H11zm0 4h8v2H11z" />
      </svg>
    ),
  },
  {
    id: 'eyes', label: 'Nghỉ mắt',
    svg: <svg width="32" height="32" viewBox="0 0 20 14" fill="currentColor"><path d="M10 0C5.45 0 1.57 2.93 0 7C1.57 11.07 5.45 14 10 14C14.55 14 18.43 11.07 20 7C18.43 2.93 14.55 0 10 0ZM10 11.5C7.52 11.5 5.5 9.48 5.5 7C5.5 4.52 7.52 2.5 10 2.5C12.48 2.5 14.5 4.52 14.5 7C14.5 9.48 12.48 11.5 10 11.5ZM10 4.5C8.62 4.5 7.5 5.62 7.5 7C7.5 8.38 8.62 9.5 10 9.5C11.38 9.5 12.5 8.38 12.5 7C12.5 5.62 11.38 4.5 10 4.5Z"/></svg>,
  },
  {
    id: 'food', label: 'Ăn uống',
    svg: <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>,
  },
  {
    id: 'stretch', label: 'Giải trí',
    svg: <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"/></svg>,
  },
  {
    id: 'bike', label: 'Đạp xe',
    svg: <svg width="32" height="32" viewBox="0 0 20 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="4" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><circle cx="13" cy="3" r="1.5" fill="currentColor" stroke="none"/><path d="M7 4H11L14 9H8L7 4Z"/><path d="M8 9L4 12"/><path d="M14 9L16 12"/><path d="M11 3L14 9"/></svg>,
  },
  {
    id: 'meditate', label: 'Thiền',
    svg: <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="3" r="2"/><path d="M10 6C10 6 7 7 5 9C7 9 9 9.5 10 11C11 9.5 13 9 15 9C13 7 10 6 10 6Z"/><path d="M3 12C3 12 5 11 7 12L10 15L13 12C15 11 17 12 17 12C17 12 14 13 13 15L10 19L7 15C6 13 3 12 3 12Z"/></svg>,
  },
  {
    id: 'folder', label: 'Tài liệu',
    svg: <svg width="32" height="32" viewBox="0 0 20 18" fill="currentColor"><path d="M18 4H10L8 2H2C0.9 2 0 2.9 0 4V14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V6C20 4.9 19.1 4 18 4ZM18 14H2V4H7.17L9.17 6H18V14Z"/></svg>,
  },
];

export const EMOJI_TO_ID: Record<string, string> = {
  '💧': 'water', '🏃': 'run', '✉️': 'email', '☕': 'coffee',
  '🧘': 'rest', '🌙': 'rest', '⚡': 'charge', '📋': 'charge', '📝': 'charge', '👀': 'eyes', '🍎': 'food',
  '🚲': 'bike', '🌈': 'meditate', '🎮': 'stretch', '📁': 'folder',
  '💉': 'water', '🎥': 'folder',
};

export const ICON_BY_ID = new Map<string, ReminderIcon>(ICONS.map((i) => [i.id, i]));

export function resolveIconId(iconValue: string): string | null {
  if (ICON_BY_ID.has(iconValue)) return iconValue;
  return EMOJI_TO_ID[iconValue] ?? null;
}

export function renderIconById(id: string, color = '#C2C6D6', size = 20): React.ReactNode {
  const found = ICON_BY_ID.get(id);
  if (!found) return <span style={{ fontSize: size * 0.7 }}>🔔</span>;
  return (
    <div
      style={{
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${size / 28})`,
      }}
    >
      {found.svg}
    </div>
  );
}

/** ReminderList — biểu tượng theo config reminder (emoji / id) */
export function renderIcon(iconValue: string, active: boolean): React.ReactNode {
  const resolvedId = resolveIconId(iconValue);
  const found = resolvedId ? ICON_BY_ID.get(resolvedId) : null;

  if (!found) {
    return (
      <span style={{ fontSize: 20, lineHeight: 1 }}>
        {iconValue && iconValue.length <= 2 ? iconValue : '🔔'}
      </span>
    );
  }

  return (
    <div
      style={{
        color: active ? '#ADC6FF' : '#C2C6D6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'scale(0.75)',
        transformOrigin: 'center',
      }}
    >
      {found.svg}
    </div>
  );
}

/** ReminderList — lịch / lặp / hành động */
export function IconClock() {
  return (
    <svg width="11" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" />
    </svg>
  );
}

export function IconRepeat() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      imageRendering="optimizeQuality"
      fillRule="evenodd"
      clipRule="evenodd"
      viewBox="0 0 426 512.288"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="nonzero"
        fill="currentColor"
        d="M52.707 232.055c0 14.554-11.799 26.353-26.354 26.353C11.799 258.408 0 246.609 0 232.055v-37.736c0-35.539 14.521-67.83 37.915-91.222 23.393-23.394 55.684-37.915 91.222-37.915h206.748L314.6 45.652c-10.688-9.834-11.379-26.473-1.545-37.161 9.834-10.688 26.473-11.378 37.161-1.545l67.239 61.692c10.687 9.834 11.378 26.473 1.544 37.161a26.017 26.017 0 01-1.558 1.558l-66.734 66.622c-10.29 10.232-26.929 10.187-37.161-.102-10.232-10.289-10.187-26.929.102-37.16l18.859-18.829h-203.37c-20.993 0-40.097 8.607-53.959 22.471-13.864 13.862-22.471 32.967-22.471 53.96v37.736zM111.4 466.636c10.688 9.834 11.379 26.473 1.545 37.161-9.834 10.688-26.473 11.378-37.161 1.545L8.545 443.649c-10.687-9.833-11.378-26.472-1.544-37.161a26.622 26.622 0 011.558-1.558l66.734-66.621c10.29-10.232 26.929-10.187 37.161.102 10.232 10.289 10.187 26.929-.102 37.16L93.493 394.4h203.37c20.993 0 40.097-8.607 53.959-22.471 13.864-13.862 22.471-32.967 22.471-53.96v-37.736c0-14.554 11.799-26.353 26.354-26.353 14.554 0 26.353 11.799 26.353 26.353v37.736c0 35.539-14.521 67.83-37.915 91.222-23.393 23.394-55.684 37.915-91.222 37.915H90.115l21.285 19.53z"
      />
    </svg>
  );
}

export function IconRepeatOne() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      imageRendering="optimizeQuality"
      fillRule="evenodd"
      clipRule="evenodd"
      viewBox="0 0 426 512.289"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="nonzero"
        fill="currentColor"
        d="M52.706 232.055c0 14.555-11.798 26.354-26.353 26.354C11.799 258.409 0 246.61 0 232.055v-37.736c0-35.538 14.523-67.83 37.915-91.222 23.392-23.392 55.684-37.915 91.222-37.915h206.748L314.6 45.652c-10.688-9.834-11.379-26.473-1.545-37.161 9.834-10.688 26.473-11.378 37.161-1.545l67.239 61.693c10.688 9.833 11.378 26.472 1.545 37.161a26.95 26.95 0 01-1.559 1.558l-66.734 66.621c-10.289 10.232-26.929 10.188-37.16-.102-10.233-10.289-10.188-26.929.101-37.16l18.859-18.829h-203.37c-20.99 0-40.095 8.608-53.959 22.472-13.864 13.864-22.472 32.968-22.472 53.959v37.736zM206.559 333.5V223.359c-8.53 7.463-18.686 13.674-32.71 15.334v-38.232c12.802-1.24 34.335-10.272 41.298-21.672h37.005V333.5h-45.593zM111.4 466.637c10.688 9.834 11.379 26.473 1.545 37.161-9.834 10.688-26.473 11.378-37.161 1.545L8.545 443.65C-2.143 433.817-2.833 417.177 7 406.489a26.95 26.95 0 011.559-1.558l66.734-66.621c10.289-10.232 26.929-10.188 37.16.101 10.233 10.29 10.188 26.929-.101 37.161l-18.859 18.829h203.37c20.993 0 40.097-8.608 53.959-22.472 13.864-13.862 22.472-32.966 22.472-53.959v-37.736c0-14.555 11.798-26.354 26.353-26.354 14.554 0 26.353 11.799 26.353 26.354v37.736c0 35.538-14.521 67.83-37.915 91.222-23.392 23.394-55.684 37.915-91.222 37.915H90.115l21.285 19.53z"
      />
    </svg>
  );
}

export function IconPaused() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 11h-5.18C12.4 9.84 11.3 9 10 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c1.3 0 2.4-.84 2.82-2H18v2l3-3-3-3v2zM10 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

export function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

export function IconDelete() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

