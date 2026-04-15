import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COLA-Net Comparison",
  description: "Compare old vs improved COLA-Net image restoration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Inline script to apply saved theme before first paint (avoids flash) */
  const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light')}catch(e){}})()`;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
