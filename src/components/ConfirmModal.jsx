import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "자산 삭제 확인",
  message = "정말로 이 자산 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
  confirmText = "삭제",
  cancelText = "취소"
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-theme-main mb-1">
              {title}
            </h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-theme-subtle">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-theme-sub hover:text-theme-main hover:bg-theme-secondary transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
