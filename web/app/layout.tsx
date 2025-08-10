import '../styles/globals.css';

export const metadata = {
  title: "RICE Prioritization",
  description: "Prioritize features with RICE"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}


