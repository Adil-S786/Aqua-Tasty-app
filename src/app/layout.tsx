import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Aqua Tasty",
  description: "Water Plant Management App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#E6FAFD] text-[#03444d]">
        {children}

        {/* ✅ MUST BE INSIDE BODY - Not inside a div, not outside */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 1800,
            style: { borderRadius: "10px", fontWeight: "600" },
          }}
        />
      </body>
    </html>
  );
}
