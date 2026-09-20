import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vetline | Agenda clínica",
  description: "Agenda operativa para una clínica veterinaria",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
