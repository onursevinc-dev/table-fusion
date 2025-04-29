import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TableFusion",
  description: "Extract and combine tables from PDF documents with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen relative">
            <header className="fixed top-0 left-0 right-0 bg-background border-b py-3 z-10">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-foreground">
                    TableFusion
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      PDF Table Extractor
                    </span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto ">{children}</main>
            <footer className="fixed bottom-0 left-0 right-0 bg-muted py-2 border-t z-10">
              <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} TableFusion. All rights
                    reserved.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Powered by{" "}
                    <a
                      href="https://onursevinc.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-foreground"
                    >
                      OnurSevinc
                    </a>
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
