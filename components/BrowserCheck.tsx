"use client";

import { useEffect, useState } from "react";

export default function BrowserCheck() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const has =
      typeof window !== "undefined" &&
      (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));
    setSupported(has);
  }, []);

  if (supported !== false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 px-6 backdrop-blur">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="font-display text-2xl font-semibold text-stone-900">
          Dieses Tool braucht Chrome oder Edge
        </h2>
        <p className="mt-3 text-stone-600">
          Der BoB Prompter nutzt die <em>Web Speech API</em>, die nur in{" "}
          <strong>Chrome</strong> und <strong>Edge</strong> verfügbar ist.
        </p>
        <p className="mt-3 text-stone-600">
          Bitte öffne diese URL in einem der beiden Browser. Safari und Firefox unterstützen
          die nötige API nicht.
        </p>
        <a
          href="https://www.google.com/chrome/"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-dark"
        >
          Chrome installieren →
        </a>
      </div>
    </div>
  );
}
