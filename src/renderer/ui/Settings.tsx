import React from 'react';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={'toggle' + (value ? ' on' : '')}
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onClick={() => onChange(!value)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onChange(!value); }}
    >
      <div className="toggleKnob" />
    </div>
  );
}

export function Settings() {
  const [autostart, setAutostart] = React.useState(false);
  const [startMinimized, setStartMinimized] = React.useState(false);

  React.useEffect(() => {
    window.reminder.getState().then(s => {
      setAutostart(!!s?.settings?.runOnStartup);
      setStartMinimized(!!s?.settings?.startMinimized);
    });
  }, []);

  return (
    <div>
      <div className="settingsSectionLabel">Hệ thống</div>
      <div className="settingsList">
        <div className="settingRow">
          <div className="settingInfo">
            <div className="settingTitle">Chạy khi khởi động Windows</div>
            <div className="settingDesc">Tự động mở khi bật máy tính</div>
          </div>
          <Toggle value={autostart} onChange={v => { setAutostart(v); window.reminder.setSettings({ runOnStartup: v }); }} />
        </div>
        <div className="settingRow">
          <div className="settingInfo">
            <div className="settingTitle">Khởi động thu nhỏ</div>
            <div className="settingDesc">Ẩn cửa sổ khi khởi động, chạy dưới tray</div>
          </div>
          <Toggle value={startMinimized} onChange={v => { setStartMinimized(v); window.reminder.setSettings({ startMinimized: v }); }} />
        </div>
      </div>

      <div className="settingsSectionLabel">Dữ liệu</div>
      <div className="settingsList">
        <div className="settingRow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div className="settingInfo">
            <div className="settingTitle">Đặt lại tất cả</div>
            <div className="settingDesc">Xóa toàn bộ nhắc nhở và cài đặt về mặc định</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn danger"
            onClick={async () => {
              const s = await window.reminder.resetAll();
              setAutostart(!!s?.settings?.runOnStartup);
              setStartMinimized(!!s?.settings?.startMinimized);
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Đặt lại tất cả
          </button>
        </div>
        </div>
        
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}