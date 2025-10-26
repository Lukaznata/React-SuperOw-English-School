import { useToastContext } from "../contexts/ToastContext";
import type { Toast as ToastType } from "../types/toast";

const Toast = ({ toast }: { toast: ToastType }) => {
  const { removeToast } = useToastContext();

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
      default:
        return "";
    }
  };

  return (
    <div
      className={`${getToastStyles()} px-6 py-4 rounded-lg shadow-lg 
      flex items-start gap-3 min-w-[300px] max-w-[500px] 
      animate-slide-in-right mb-3`}
    >
      <span className="text-2xl font-bold mt-0.5">{getIcon()}</span>
      <p className="flex-1 font-medium whitespace-pre-line">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-white hover:text-gray-200 text-xl font-bold"
      >
        ×
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToastContext();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
