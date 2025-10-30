"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import { useUser } from "@/store/user/userState";
import { useEffect } from "react";
import Cookies from "js-cookie";
import { API } from "@/services";
import { logout } from "@/lib/utils";
import { useRouter } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { setUser } = useUser();
  const router = useRouter();
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

  const fetchUserData = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    try {
      const data = await API.getUser();
      const response = data.data.data;
      setUser(response);
    } catch (error) {
      logout(router);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ToastContainer key="toast-container" />
        {children}
      </body>
    </html>
  );
}
