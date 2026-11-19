"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function subscribeSpeechSupport() {
  return () => {};
}

function getSpeechSupportSnapshot() {
  return !!getSpeechRecognitionCtor();
}

function getSpeechSupportServerSnapshot() {
  return true;
}

export type SpeechToTextStatus = "unsupported" | "idle" | "listening" | "error";

export function useSpeechToText(options?: {
  lang?: string;
  onFinal?: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
}) {
  const speechSupported = useSyncExternalStore(
    subscribeSpeechSupport,
    getSpeechSupportSnapshot,
    getSpeechSupportServerSnapshot,
  );
  const [liveStatus, setLiveStatus] = useState<"idle" | "listening" | "error">("idle");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const onFinalRef = useRef(options?.onFinal);
  const onInterimRef = useRef(options?.onInterim);
  const lang = options?.lang ?? "en-US";

  const status: SpeechToTextStatus = speechSupported ? liveStatus : "unsupported";

  useEffect(() => {
    onFinalRef.current = options?.onFinal;
    onInterimRef.current = options?.onInterim;
  }, [options?.onFinal, options?.onInterim]);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalChunk += text;
        else interim += text;
      }
      if (finalChunk) onFinalRef.current?.(finalChunk);
      if (interim) onInterimRef.current?.(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      shouldListenRef.current = false;
      setError(event.error || "Speech recognition failed.");
      setLiveStatus("error");
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          shouldListenRef.current = false;
        }
      }
      setLiveStatus("idle");
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }
    setError("");
    shouldListenRef.current = true;
    try {
      recognition.start();
      setLiveStatus("listening");
    } catch {
      // Already started
      setLiveStatus("listening");
    }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setLiveStatus("idle");
  }, []);

  const toggle = useCallback(() => {
    if (status === "listening") stop();
    else start();
  }, [start, status, stop]);

  return {
    status,
    error,
    supported: status !== "unsupported",
    listening: status === "listening",
    start,
    stop,
    toggle,
  };
}
