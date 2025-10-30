"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { useEffect, useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Apenas no cliente
  }, []);

  if (!isClient) {
    return null; // Não renderiza nada até o cliente ser montado
  }

  return (
    <>
      <ToastContainer key="toast-container" />
      <main className="flex-1 h-full overflow-y-auto transition-all duration-300" suppressHydrationWarning>
        {children}
      </main>
    </>
  );
}