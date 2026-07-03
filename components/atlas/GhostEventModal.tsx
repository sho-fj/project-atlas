"use client";

import { useEffect, useState } from "react";

type GhostEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  messages: string[];
};

export default function GhostEventModal({ isOpen, onClose, messages }: GhostEventModalProps) {
  const [selectedMessage, setSelectedMessage] = useState("");
  const [displayedText, setDisplayedText] = useState("");

  const handleClose = () => {
    setDisplayedText("");
    setSelectedMessage("");
    onClose();
  };

  useEffect(() => {
    if (!isOpen || messages.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      const nextMessage = messages[Math.floor(Math.random() * messages.length)];
      setSelectedMessage(nextMessage);
      setDisplayedText("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen || !selectedMessage) {
      return;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedText(selectedMessage.slice(0, index));

      if (index >= selectedMessage.length) {
        window.clearInterval(timer);
      }
    }, 35);

    return () => window.clearInterval(timer);
  }, [isOpen, selectedMessage]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-atlas-primary/45 px-4">
      <div className="atlas-console w-full max-w-2xl border border-white/10 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/45">Ghost Event</p>
        <h3 className="mt-3 text-2xl font-semibold">誰かが現れた</h3>
        <p className="mt-6 min-h-28 whitespace-pre-wrap font-mono text-base leading-8 text-white/80">
          {displayedText}
          <span className="ml-1 animate-pulse">|</span>
        </p>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="atlas-button-ghost min-h-10 border border-white/10 bg-white/10 px-5 py-2.5 text-sm text-white hover:bg-white/20"
          >
            Atlasへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
