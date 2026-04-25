import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

type WakeLockNav = Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } };

export default function Index() {
  const [isActive, setIsActive] = useState(false);
  const [supported, setSupported] = useState(true);
  const [time, setTime] = useState(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!("wakeLock" in navigator)) {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && isActive) {
        try {
          wakeLockRef.current = await (navigator as WakeLockNav).wakeLock.request("screen");
        } catch (err) {
          console.warn("WakeLock reacquire failed", err);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isActive]);

  const activate = async () => {
    try {
      wakeLockRef.current = await (navigator as WakeLockNav).wakeLock.request("screen");
      setIsActive(true);
      setTime(0);
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } catch {
      setSupported(false);
    }
  };

  const deactivate = () => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTime(0);
  };

  const toggle = () => {
    if (isActive) deactivate();
    else activate();
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-xs text-center">

        <div className="mb-10">
          <h1 className="font-mono text-xl font-medium text-foreground tracking-tight mb-1">
            Не спать
          </h1>
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            экран всегда включён
          </p>
        </div>

        <button
          onClick={toggle}
          disabled={!supported}
          className={`relative w-40 h-40 rounded-full mx-auto flex items-center justify-center transition-all duration-500 mb-10 ${
            !supported
              ? "bg-muted cursor-not-allowed"
              : isActive
              ? "bg-primary/10 border-2 border-primary"
              : "bg-card border-2 border-border hover:border-muted-foreground"
          }`}
        >
          {isActive && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-primary pulse-ring" />
              <div
                className="absolute inset-0 rounded-full border border-primary/30 pulse-ring"
                style={{ animationDelay: "0.5s" }}
              />
            </>
          )}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <Icon
              name={isActive ? "Sun" : "Moon"}
              size={36}
              className={`transition-colors duration-300 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span
              className={`font-mono text-xs tracking-widest uppercase transition-colors duration-300 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {isActive ? "активно" : "нажмите"}
            </span>
          </div>
        </button>

        {isActive && (
          <div className="bg-card border border-border rounded-lg p-5 mb-4 animate-fade-in">
            <div className="font-mono text-3xl font-medium text-foreground tabular-nums mb-1">
              {formatTime(time)}
            </div>
            <div className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              экран не гас
            </div>
          </div>
        )}

        {!supported && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 animate-fade-in">
            <p className="font-mono text-xs text-destructive/80">
              Откройте в Chrome на Android — браузер поддерживает блокировку экрана
            </p>
          </div>
        )}

        {!isActive && supported && (
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            Нажмите на кнопку — и экран телефона не будет гаснуть, пока эта страница открыта
          </p>
        )}
      </div>
    </div>
  );
}