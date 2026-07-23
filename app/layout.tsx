import type { Metadata } from "next";
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";
import "@fontsource/hind/400.css";
import "@fontsource/hind/500.css";
import "@fontsource/hind/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "मस्ती की पाठशाला | GSSS Mariwara",
  description:
    "कक्षा 7 के लिए खेल, बातचीत और गणित से भरी एक रंगीन ऑनलाइन पाठशाला।",
  applicationName: "मस्ती की पाठशाला",
  openGraph: {
    title: "मस्ती की पाठशाला",
    description: "जहाँ गणित मिलता है खेल, हँसी और जिज्ञासा से।",
    type: "website",
    locale: "hi_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem("masti-ki-pathshala-theme");
                var preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                document.documentElement.dataset.theme = savedTheme || preferredTheme;
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
