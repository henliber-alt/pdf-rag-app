export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: 'Arial, sans-serif', margin: 0, background: '#f6f7fb' }}>{children}</body>
    </html>
  );
}
