import toast from "react-hot-toast";

/**
 * Toast notification utilities
 * Wrapper around react-hot-toast with consistent styling
 */

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
      style: {
        background: "#141414",
        color: "#FFFFFF",
        border: "1px solid #10B981",
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
      style: {
        background: "#141414",
        color: "#FFFFFF",
        border: "1px solid #EF4444",
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: "#141414",
        color: "#FFFFFF",
        border: "1px solid #00FF87",
      },
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: {
          background: "#141414",
          color: "#FFFFFF",
          border: "1px solid #262626",
        },
      }
    );
  },

  custom: (message: string, options?: any) => {
    toast(message, {
      duration: 4000,
      style: {
        background: "#141414",
        color: "#FFFFFF",
        border: "1px solid #262626",
      },
      ...options,
    });
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};

export default showToast;
