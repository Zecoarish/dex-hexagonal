import "./globals.css";
import React from "react";

export const metadata = {
  title: "Hexagonal Trade",
  description: "DEX Perpetual Futures",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

