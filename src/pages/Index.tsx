import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

export default function Index() {
  const [isRunning, setIsRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1000);
  const [clickCount, setClickCount] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [lastClick, setLastClick] = useState(false);
  const [inputVal, setInputVal] = useState("1000");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const triggerClick = useCallback(() => {
    setClickCount((c) => c + 1);
    setLastClick(true);
    setTimeout(() => setLastClick(false), 150);
    if (counterRef.current) {
      counterRef.current.classList.remove("counter-tick");
      void counterRef.current.offsetWidth;
      counterRef.current.classList.add("counter-tick");
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(triggerClick, intervalMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, intervalMs, triggerClick]);

  const handlePickPosition = () => {
    setIsPicking(true);
    setIsRunning(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsPicking(false);
  };

  const handleToggle = () => {
    if (!isRunning && !position) return;
    const next = !isRunning;
    setIsRunning(next);
    if (!next) setClickCount(0);
  };

  const handleIntervalChange = (val: string) => {
    setInputVal(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 50 && num <= 60000) {
      setIntervalMs(num);
    }
  };

  const presets = [100, 500, 1000, 2000];
  const canStart = position !== null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">

      {isPicking && (
        <div
          className="fixed inset-0 z-50 cursor-crosshair"
          style={{ background: "rgba(0,0,0,0.82)" }}
          onClick={handleOverlayClick}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3">
              <Icon name="Crosshair" size={32} className="text-primary mx-auto" />
              <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
                кликните в нужную точку экрана
              </p>
            </div>
          </div>
        </div>
      )}

      {position && isRunning && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{ left: position.x - 12, top: position.y - 12 }}
        >
          <div
            className="absolute rounded-full bg-primary pulse-ring"
            style={{ width: 24, height: 24, top: 0, left: 0 }}
          />
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-75 relative z-10 ${
              lastClick
                ? "bg-primary border-primary scale-75"
                : "bg-transparent border-primary dot-active"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
        </div>
      )}

      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                isRunning ? "bg-primary dot-active" : "bg-muted-foreground"
              }`}
            />
            <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              {isRunning ? "активен" : "остановлен"}
            </span>
          </div>
          <h1 className="font-mono text-2xl font-medium text-foreground tracking-tight">
            AutoClick
          </h1>
        </div>

        <div className="space-y-px">
          <div className="bg-card border border-border rounded-t-lg p-5">
            <label className="font-mono text-xs text-muted-foreground tracking-widest uppercase block mb-3">
              интервал (мс)
            </label>
            <div className="flex gap-2 mb-3">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setIntervalMs(p);
                    setInputVal(String(p));
                  }}
                  className={`font-mono text-xs px-2.5 py-1.5 rounded border transition-all duration-150 ${
                    intervalMs === p
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={inputVal}
              onChange={(e) => handleIntervalChange(e.target.value)}
              min={50}
              max={60000}
              className="w-full bg-input border border-border rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="50–60000"
            />
          </div>

          <div className="bg-card border border-border p-5">
            <label className="font-mono text-xs text-muted-foreground tracking-widest uppercase block mb-3">
              позиция клика
            </label>
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">
                {position ? (
                  <span className="text-foreground">
                    <span className="text-muted-foreground">x </span>
                    {Math.round(position.x)}
                    <span className="text-muted-foreground mx-2">/</span>
                    <span className="text-muted-foreground">y </span>
                    {Math.round(position.y)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">не задана</span>
                )}
              </div>
              <button
                onClick={handlePickPosition}
                className="flex items-center gap-1.5 font-mono text-xs px-3 py-2 border border-border rounded hover:border-primary hover:text-primary text-muted-foreground transition-all duration-150"
              >
                <Icon name="Crosshair" size={13} />
                выбрать
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-b-lg p-5">
            <label className="font-mono text-xs text-muted-foreground tracking-widest uppercase block mb-3">
              кликов выполнено
            </label>
            <span
              ref={counterRef}
              className="font-mono text-3xl font-medium text-foreground tabular-nums"
            >
              {clickCount.toLocaleString("ru-RU")}
            </span>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={!canStart}
          className={`w-full mt-4 py-4 rounded-lg font-mono text-sm font-medium tracking-wide transition-all duration-200 ${
            isRunning
              ? "bg-destructive/90 hover:bg-destructive text-destructive-foreground"
              : canStart
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <Icon name="Square" size={14} />
              остановить
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Icon name="Play" size={14} />
              {canStart ? "запустить" : "выберите позицию"}
            </span>
          )}
        </button>

        {isRunning && (
          <div className="mt-3 text-center">
            <span className="font-mono text-xs text-muted-foreground">
              клик каждые{" "}
              {intervalMs >= 1000 ? `${intervalMs / 1000} с` : `${intervalMs} мс`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
