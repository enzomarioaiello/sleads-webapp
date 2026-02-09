"use client";
import React from "react";
import useSleadsCMS from "../cms-hook/useSleadsCMS";
import LanguageSelector from "./LanguageSelector";

export default function CmsTestPage() {
  const { c, showFieldsAlert } = useSleadsCMS();

  return (
    <div className="relative min-h-screen mt-20 w-full overflow-hidden bg-white dark:bg-sleads-midnight transition-colors duration-300">
      <LanguageSelector />
      <div className="mt-20">{c("title", "Hello world")}</div>
      <div className="mt-20">{c("description", "This is a description")}</div>
      <div className="mt-20">
        {c("image", "https://via.placeholder.com/150")}
      </div>
      <div className="mt-20">{c("buttonText", "Haloooo")}</div>
      <div className="mt-20">{c("buttonLink", "https://www.google.com")}</div>
      <div className="mt-20">{c("buttonColor", "blue")}</div>
      <div className="mt-20">{c("buttonTextColor", "white")}</div>
      <div className="mt-20">{c("buttonBackgroundColor", "blue")}</div>
      <div className="mt-20">{c("buttonBorderColor", "blue")}</div>
      <button onClick={showFieldsAlert}>Show fields</button>
    </div>
  );
}
