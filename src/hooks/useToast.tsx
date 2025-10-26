import { useToastContext } from "../contexts/ToastContext";
import type { ToastType } from "../types/toast";

export const useToast = () => {
  const { addToast } = useToastContext();

  const showToast = (
    message: string,
    type: ToastType = "info",
    duration?: number
  ) => {
    addToast(message, type, duration);
  };

  const success = (message: string, duration?: number) => {
    addToast(message, "success", duration);
  };

  const error = (message: string, duration?: number) => {
    addToast(message, "error", duration);
  };

  const info = (message: string, duration?: number) => {
    addToast(message, "info", duration);
  };

  const warning = (message: string, duration?: number) => {
    addToast(message, "warning", duration);
  };

  return { showToast, success, error, info, warning };
};
