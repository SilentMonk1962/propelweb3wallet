import type { Metadata } from "next";
//import localFont from "next/font/local";
import "./globals.css";
//import { Inter } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers"; // added
import ContextProvider from '@/context'

export const metadata: Metadata = {
  title: "Web3 Propel",
  description: "By Ataraxia Software Studios"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookies = headers().get('cookie')
  return (
    <html lang="en">
      <body>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  )
}