import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ОЛЖАПРОЕКТ — CRM",
  description: "Внутренняя CRM-система компании ОЛЖАПРОЕКТ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
