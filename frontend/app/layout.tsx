import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Text-to-SQL Chatbot",
  description: "Convert natural language to SQL queries using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
