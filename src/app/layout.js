import "./globals.css";
import ThemeRegistry from "@/app/styles/themeRegistry";
import { MessageProvider } from "@/app/context/MessageContext";
import { LanguageProvider } from "./context/LanguageContext";

export const metadata = {
  title: "MTCIT Interactive Timeline",
  description:
    "Explore the milestones of the Ministry of Transport, Communication and Information Technology (MTCIT) — an interactive digital showcase.",
  keywords:
    "MTCIT, Ministry of Transport, Communication, Information Technology, Interactive Timeline, Oman, Digital Showcase, WhiteWall, WhiteWall Digital Solutions, WWDS",
  author: "WhiteWall Digital Solutions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#96D8EA" />
        <link rel="icon" href="/osh-icon.png" type="image/png" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta name="author" content={metadata.author} />
      </head>
      <body>
        <ThemeRegistry>
          <LanguageProvider>
            <MessageProvider>{children}</MessageProvider>
          </LanguageProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
