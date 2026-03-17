import React from 'react';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={'toggle' + (value ? ' on' : '')}
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onClick={() => onChange(!value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onChange(!value);
      }}
    >
      <div className="toggleKnob" />
    </div>
  );
}

export function Settings() {
  const [dark, setDark] = React.useState(true);
  const [autostart, setAutostart] = React.useState(false);
  const [startMinimized, setStartMinimized] = React.useState(false);

  React.useEffect(() => {
    window.reminder.getState().then((s) => {
      setDark(!!s?.settings?.darkMode);
      setAutostart(!!s?.settings?.runOnStartup);
      setStartMinimized(!!s?.settings?.startMinimized);
    });
  }, []);

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800 }}>Giao diện tối</div>
          <div style={{ color: 'rgba(231,238,252,0.55)', fontSize: 13, marginTop: 4 }}>
            Dễ nhìn hơn trong điều kiện ánh sáng yếu
          </div>
        </div>
        <Toggle
          value={dark}
          onChange={(v) => {
            setDark(v);
            window.reminder.setSettings({ darkMode: v });
          }}
        />
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800 }}>Chạy khi khởi động Windows</div>
          <div style={{ color: 'rgba(231,238,252,0.55)', fontSize: 13, marginTop: 4 }}>Tự động mở khi bật máy tính</div>
        </div>
        <Toggle
          value={autostart}
          onChange={(v) => {
            setAutostart(v);
            window.reminder.setSettings({ runOnStartup: v });
          }}
        />
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800 }}>Khởi động thu nhỏ</div>
          <div style={{ color: 'rgba(231,238,252,0.55)', fontSize: 13, marginTop: 4 }}>Ẩn cửa sổ khi khởi động</div>
        </div>
        <Toggle
          value={startMinimized}
          onChange={(v) => {
            setStartMinimized(v);
            window.reminder.setSettings({ startMinimized: v });
          }}
        />
      </div>

      <div className="section" style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 900, margin: '18px 0 12px' }}>Quản lý dữ liệu</div>
        <button
          className="btn danger"
          style={{ width: '100%' }}
          onClick={async () => {
            const s = await window.reminder.resetAll();
            setDark(!!s?.settings?.darkMode);
            setAutostart(!!s?.settings?.runOnStartup);
            setStartMinimized(!!s?.settings?.startMinimized);
          }}
        >
          🗑 Đặt lại tất cả
        </button>
      </div>
      <div style={{ height: 18 }} />
    </div>
  );
}

