import React from 'react';
import type { UpdateCheckResult, UpdateManifest } from '../../shared/update';

function manifestNoteLines(m: UpdateManifest): string[] {
  if (m.notesLines?.length) return m.notesLines;
  if (m.notes?.trim()) {
    return m.notes
      .trim()
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function UpdateModal({
  open,
  checking,
  result,
  onClose,
  onRecheck,
  onOpenDownload,
}: {
  open: boolean;
  checking: boolean;
  result: UpdateCheckResult | null;
  onClose: () => void;
  onRecheck: () => void;
  onOpenDownload: (url: string) => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const downloadUrl =
    result?.status === 'available'
      ? result.manifest.windows?.portableExe?.url?.trim()
      : undefined;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(173,198,255,.12)',
          borderRadius: 18,
          padding: '28px 26px 22px',
          width: 440,
          maxWidth: 'calc(100vw - 32px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#DAE2FD', marginBottom: 6 }}>
            {checking ? 'Đang kiểm tra cập nhật' : 'Cập nhật ứng dụng'}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(173,198,255,.5)', lineHeight: 1.5 }}>
            {checking
              ? 'Đang tải thông tin phiên bản từ máy chủ…'
              : 'Portable — sau khi tải, thay file chạy theo hướng dẫn nội bộ hoặc pipeline cài đặt của bạn.'}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(173,198,255,.08)' }} />

        {checking && (
          <div style={{ fontSize: 14, color: 'rgba(173,198,255,.65)', padding: '8px 0' }}>
            Vui lòng đợi…
          </div>
        )}

        {!checking && result?.status === 'latest' && (
          <div>
            <div style={{ fontSize: 14, color: '#DAE2FD', marginBottom: 8 }}>
              Bạn đang dùng phiên bản mới nhất.
            </div>
            <div style={{ fontSize: 13, color: 'rgba(173,198,255,.45)' }}>
              Phiên bản hiện tại: <strong style={{ color: 'rgba(173,198,255,.7)' }}>{result.currentVersion}</strong>
              {' · '}
              Máy chủ: {result.latestVersion}
            </div>
          </div>
        )}

        {!checking && result?.status === 'available' && (
          <div>
            <div style={{ fontSize: 14, color: '#DAE2FD', marginBottom: 10 }}>
              Có phiên bản mới:{' '}
              <strong style={{ color: '#7eb8f7' }}>{result.latestVersion}</strong>
              <span style={{ color: 'rgba(173,198,255,.45)', fontWeight: 400 }}>
                {' '}(đang dùng {result.currentVersion})
              </span>
            </div>
            {manifestNoteLines(result.manifest).length > 0 && (
              <ul
                style={{
                  margin: '0 0 12px',
                  paddingLeft: 18,
                  fontSize: 13,
                  color: 'rgba(173,198,255,.55)',
                  lineHeight: 1.5,
                }}
              >
                {manifestNoteLines(result.manifest).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
            {downloadUrl ? (
              <button
                type="button"
                onClick={() => onOpenDownload(downloadUrl)}
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(180deg, #4a90d9 0%, #2f6fbe 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Mở liên kết tải xuống
              </button>
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(240,180,100,.85)' }}>
                Manifest chưa có URL tải (windows.portableExe.url). Liên hệ quản trị để bổ sung.
              </div>
            )}
          </div>
        )}

        {!checking && result?.status === 'error' && (
          <div>
            <div style={{ fontSize: 14, color: '#ff9b9b', marginBottom: 8 }}>
              Không kiểm tra được cập nhật
            </div>
            <div style={{ fontSize: 13, color: 'rgba(173,198,255,.5)', lineHeight: 1.5 }}>
              {result.error}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!checking && (
            <button
              type="button"
              onClick={onRecheck}
              style={{
                flex: 1,
                minWidth: 120,
                height: 40,
                borderRadius: 10,
                background: '#222A3D',
                border: '1px solid #424754',
                color: '#DAE2FD',
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              Kiểm tra lại
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              minWidth: 120,
              height: 40,
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid rgba(173,198,255,.12)',
              color: 'rgba(173,198,255,.55)',
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
