"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#141414",
          color: "#FFFFFF",
          border: "1px solid #262626",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: "#FFFFFF",
          },
          style: {
            border: "1px solid #10B981",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#FFFFFF",
          },
          style: {
            border: "1px solid #EF4444",
          },
        },
        loading: {
          iconTheme: {
            primary: "#00FF87",
            secondary: "#FFFFFF",
          },
        },
      }}
    />
  );
}
