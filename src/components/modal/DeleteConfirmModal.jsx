export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
  }) {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white w-80 rounded-xl shadow-lg p-6 text-center">
  
          <h3 className="text-lg font-semibold mb-4">
            Apakah Anda yakin?
          </h3>
  
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              TIDAK
            </button>
  
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              IYA
            </button>
          </div>
        </div>
      </div>
    );
  }