"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DrawerMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  // ✅ Load settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedLang = localStorage.getItem("lang") as "en" | "hi" | null;

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }

    if (savedLang) setLanguage(savedLang);
  }, []);

  // ✅ Toggle theme
  const toggleTheme = () => {
    const newTheme = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // ✅ Toggle language
  const toggleLanguage = () => {
    const newLang = language === "en" ? "hi" : "en";
    setLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  // ✅ Translations (simple dictionary)
  const t = (en: string, hi: string) => (language === "hi" ? hi : en);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#062E33] shadow-xl z-50 p-4 flex flex-col justify-between"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
          >
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-[#045b68] dark:text-[#A9F0FF] mb-4">
                🌊 {t("Water Plant", "वाटर प्लांट")}
              </h2>

              <nav className="space-y-2">
                <a href="/" className="block px-3 py-2 rounded-lg hover:bg-[#B4F2EE]/40 dark:hover:bg-[#0C3C40]">
                  🏠 {t("Dashboard", "डैशबोर्ड")}
                </a>
                <a href="/sales" className="block px-3 py-2 rounded-lg hover:bg-[#B4F2EE]/40 dark:hover:bg-[#0C3C40]">
                  💼 {t("Sales", "बिक्री")}
                </a>
                <a href="/customers" className="block px-3 py-2 rounded-lg hover:bg-[#B4F2EE]/40 dark:hover:bg-[#0C3C40]">
                  👥 {t("Customers", "ग्राहक")}
                </a>
                <a href="/payments" className="block px-3 py-2 rounded-lg hover:bg-[#B4F2EE]/40 dark:hover:bg-[#0C3C40]">
                  💰 {t("Payments", "भुगतान इतिहास")}
                </a>
                <a href="/expenses" className="block px-3 py-2 rounded-lg hover:bg-[#B4F2EE]/40 dark:hover:bg-[#0C3C40]">
                  💸 {t("Expenses", "खर्चे")}
                </a>
                <a href="/reminders" className="block px-3 py-2 rounded-lg hover:bg-[#B4F2EE]/40 dark:hover:bg-[#0C3C40]">
                  ⏰ {t("Reminders", "रिमाइंडर")}
                </a>
              </nav>
            </div>

            {/* Footer Settings */}
            {/* <div className="mt-6 border-t border-gray-300 dark:border-gray-600 pt-3 space-y-2"> */}
              {/* Theme Toggle
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#B4F2EE]/40 dark:hover:bg-[#0C3C40]"
              >
                <span className="text-[#045b68] dark:text-gray-100 font-medium">
                  {darkMode ? t("Dark Mode", "डार्क मोड") : t("Light Mode", "लाइट मोड")}
                </span>
                <div
                  className={`w-10 h-5 rounded-full p-[2px] flex items-center transition ${
                    darkMode ? "bg-[#045b68] justify-end" : "bg-gray-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </button>

              {/* Language Toggle */}
              {/* <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#B4F2EE]/40 dark:hover:bg-[#0C3C40]"
              >
                <span className="text-[#045b68] dark:text-gray-100 font-medium">
                  {language === "hi" ? "🇮🇳 हिंदी" : "🌍 English"}
                </span>
                <div
                  className={`w-10 h-5 rounded-full p-[2px] flex items-center transition ${
                    language === "hi"
                      ? "bg-[#045b68] justify-end"
                      : "bg-gray-300 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </button> */}

              {/* Logout */}
              {/* <a
                href="#"
                className="block mt-3 px-3 py-2 rounded-lg text-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                🚪 {t("Logout", "लॉगआउट")}
              </a> 
            </div> */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
