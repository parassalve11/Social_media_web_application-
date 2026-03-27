"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { persistor, store } from "@/store";
import { ToastManager } from "@/components/UI/ToastManager";
import NotificationToast from "@/components/UI/NotificationToast";
import SocketInitializer from "@/lib/SocketInitializer";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <GoogleOAuthProvider clientId={googleClientId}>
            <ToastManager>
              <SocketInitializer />
              {children}
            </ToastManager>
            <NotificationToast />
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
