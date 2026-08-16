import "./globals.css";

export const metadata = {
  title: "Nexora AI",
  description: "Ask anything. Explore everything.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
