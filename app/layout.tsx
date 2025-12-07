import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FurniManager - Furniture Shop Dashboard",
  description: "Manage your furniture shop inventory, orders, and customers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // dark  is defalut theme
    <html lang="en" suppressHydrationWarning >
      <body
        className={`${poppins.variable} font-sans antialiased`}

      >
        {children}
      </body>
    </html>
  );
}
