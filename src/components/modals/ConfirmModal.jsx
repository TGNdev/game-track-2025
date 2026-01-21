import Modal from "./Modal";

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex flex-col gap-6">
        <p className="text-white/70 leading-relaxed font-medium">
          {message}
        </p>

        <div className="flex flex-row gap-3 mt-2">
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg ${type === "danger"
              ? "bg-red-500/30 border border-red-500/40 text-red-500 hover:bg-red-500/20 shadow-red-500/10"
              : "bg-gradient-primary text-white shadow-primary/20"
              }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
