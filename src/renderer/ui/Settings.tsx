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

export function Settings({
  appVersion,
  onCheckForUpdates,
}: {
  appVersion: string | null;
  onCheckForUpdates: () => void;
}) {
  const [autostart, setAutostart] = React.useState(false);
  const [startMinimized, setStartMinimized] = React.useState(false);
  const [clearingCache, setClearingCache] = React.useState(false);
  const [cacheMessage, setCacheMessage] = React.useState<string>('');

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
          <Toggle value={autostart} onChange={v => {
            setAutostart(v);
            window.reminder.setSettings({ runOnStartup: v });
          }} />
        </div>
        <div className="settingRow">
          <div className="settingInfo">
            <div className="settingTitle">Khởi động thu nhỏ</div>
            <div className="settingDesc">Ẩn cửa sổ khi khởi động, chạy dưới tray</div>
          </div>
          <Toggle value={startMinimized} onChange={v => {
            setStartMinimized(v);
            window.reminder.setSettings({ startMinimized: v });
          }} />
        </div>
      </div>

      <div className="settingsSectionLabel">Cập nhật</div>
      <div className="settingsList">
        <div className="settingRow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <div className="settingInfo">
            <div className="settingTitle">Phiên bản hiện tại</div>
            <div className="settingDesc">
              {appVersion ?? 'Đang tải…'} — Kiểm tra bản portable mới (máy chủ cập nhật được tích hợp sẵn trong bản cài).
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn primary"
              onClick={onCheckForUpdates}
            >
              Kiểm tra cập nhật
            </button>
          </div>
        </div>
      </div>

      <div className="settingsSectionLabel">Dữ liệu</div>
      <div className="settingsList">
        <div className="settingRow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div className="settingInfo">
            <div className="settingTitle">Xóa cache ứng dụng</div>
            <div className="settingDesc">Dọn bộ nhớ đệm thủ công khi cần xử lý lỗi hiển thị hoặc dữ liệu cache cũ.</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn"
              disabled={clearingCache}
              onClick={async () => {
                setClearingCache(true);
                setCacheMessage('');
                try {
                  await window.reminder.clearCache();
                  setCacheMessage('Đã xóa cache. Vui lòng mở lại ứng dụng nếu bạn muốn tối ưu hiệu quả.');
                } catch {
                  setCacheMessage('Không thể xóa cache. Vui lòng thử lại.');
                } finally {
                  setClearingCache(false);
                }
              }}
            >
              {clearingCache ? 'Đang xóa cache...' : 'Xóa cache'}
            </button>
          </div>
          {cacheMessage ? (
            <div className="settingDesc" style={{ textAlign: 'center' }}>
              {cacheMessage}
            </div>
          ) : null}
        </div>

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