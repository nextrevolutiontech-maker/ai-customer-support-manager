import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NRT AI Customer Support Manager",
  description: "Enterprise SaaS AI employee platform for automated support management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
