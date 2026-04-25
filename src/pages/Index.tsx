import { useState, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

interface Material {
  type: string;
  size: string;
  quantity: number;
  unit: string;
  total_length_m: number | null;
  weight_kg: number | null;
  comment: string | null;
}

interface Analysis {
  materials: Material[];
  total_weight_kg: number | null;
  weld_length_m: number | null;
  fasteners: string | null;
  notes: string;
}

export default function Index() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Поддерживаются форматы: JPG, PNG, WEBP, GIF, PDF");
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);

      const base64 = dataUrl.split(",")[1];
      const mimeType = file.type === "application/pdf" ? "application/pdf" : file.type;

      setLoading(true);
      try {
        const resp = await fetch(func2url["analyze-drawing"], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_data: base64, mime_type: mimeType }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Ошибка анализа");
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Ошибка при анализе");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Ruler" size={16} className="text-primary" />
            <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">металлоконструкции</span>
          </div>
          <h1 className="font-mono text-2xl font-medium text-foreground tracking-tight">
            Расчёт материалов
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Загрузите чертёж — ИИ определит список металлопроката
          </p>
        </div>

        {!preview && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Icon name="Upload" size={32} className={`mx-auto mb-4 transition-colors ${dragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className="font-mono text-sm text-foreground mb-1">
              {dragging ? "Отпустите файл" : "Перетащите чертёж или нажмите"}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              JPG, PNG, WEBP, GIF, PDF
            </p>
          </div>
        )}

        {preview && !result && (
          <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
            <div className="relative">
              <img src={preview} alt="Чертёж" className="w-full max-h-64 object-contain bg-muted/30 p-2" />
              {!loading && (
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center hover:border-primary transition-colors"
                >
                  <Icon name="X" size={12} className="text-muted-foreground" />
                </button>
              )}
            </div>
            {loading && (
              <div className="p-6 text-center border-t border-border">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="font-mono text-sm text-foreground">Анализирую чертёж...</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">Это займёт 10–20 секунд</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-lg p-4 animate-fade-in">
            <div className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-destructive mt-0.5 shrink-0" />
              <p className="font-mono text-xs text-destructive">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preview && (
                  <img src={preview} alt="" className="w-10 h-10 object-cover rounded border border-border" />
                )}
                <div>
                  <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Результат</p>
                  <p className="font-mono text-sm text-foreground">{result.materials.length} позиций</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="font-mono text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary px-3 py-1.5 rounded transition-all"
              >
                новый чертёж
              </button>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border">
                <span className="col-span-4 font-mono text-xs text-muted-foreground uppercase tracking-widest">Материал</span>
                <span className="col-span-2 font-mono text-xs text-muted-foreground uppercase tracking-widest">Размер</span>
                <span className="col-span-2 font-mono text-xs text-muted-foreground uppercase tracking-widest text-right">Кол-во</span>
                <span className="col-span-2 font-mono text-xs text-muted-foreground uppercase tracking-widest text-right">Длина</span>
                <span className="col-span-2 font-mono text-xs text-muted-foreground uppercase tracking-widest text-right">Вес</span>
              </div>
              {result.materials.map((m, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 transition-colors hover:bg-muted/30 ${
                    i < result.materials.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="col-span-4">
                    <p className="font-mono text-sm text-foreground leading-tight">{m.type}</p>
                    {m.comment && <p className="font-mono text-xs text-muted-foreground mt-0.5">{m.comment}</p>}
                  </div>
                  <div className="col-span-2">
                    <span className="font-mono text-xs text-muted-foreground">{m.size || "—"}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-sm text-foreground">{m.quantity}</span>
                    <span className="font-mono text-xs text-muted-foreground ml-1">{m.unit}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-xs text-muted-foreground">
                      {m.total_length_m != null ? `${m.total_length_m} м` : "—"}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-xs text-muted-foreground">
                      {m.weight_kg != null ? `${m.weight_kg} кг` : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Общий вес</p>
                <p className="font-mono text-lg font-medium text-primary">
                  {result.total_weight_kg != null ? `${result.total_weight_kg} кг` : "—"}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Сварные швы</p>
                <p className="font-mono text-lg font-medium text-foreground">
                  {result.weld_length_m != null ? `${result.weld_length_m} м` : "—"}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Крепёж</p>
                <p className="font-mono text-xs text-foreground leading-tight">
                  {result.fasteners || "—"}
                </p>
              </div>
            </div>

            {result.notes && (
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Примечания</p>
                <p className="font-mono text-xs text-foreground leading-relaxed">{result.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
