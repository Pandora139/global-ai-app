import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "NEXUS Dashboard",
  description: "Panel de expertos con IA integrada",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#f8fafc] text-gray-900">
        {children}
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}
