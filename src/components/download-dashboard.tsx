<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Check, CheckCircle2, ChevronRight, CirclePause, CirclePlay, Clock3, Download, Eye, LoaderCircle, Pause, Play, RefreshCw, RotateCcw, Search, Trash2, XCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
=======
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ChevronRight, CirclePause, CirclePlay, Clock3, Download, Eye, LoaderCircle, Pause, Play, RefreshCw, RotateCcw, Search, Trash2, XCircle, type LucideIcon } from "lucide-react";
>>>>>>> 756da25 (1)
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
<<<<<<< HEAD
import { connectMusicSocket, musicApi, type Metadata, type MusicState, type QueueItem, type QueueStatus, type SelectionOption } from "@/lib/music-api";
=======
import { releases, type Release, type Task, type TaskStatus } from "@/lib/music-data";
import { addToQueue, analyzeLink, getBackendState, setQueuePaused as updateQueuePaused } from "@/lib/backend-api";
>>>>>>> 756da25 (1)
import { cn } from "@/lib/utils";

type UiStatus = "Processando" | "Pendente" | "Concluída" | "Falha" | "Cancelada" | "Pausada";
const statusStyles: Record<UiStatus, string> = { Processando: "bg-info-soft text-info", Pendente: "bg-muted text-muted-foreground", Concluída: "bg-success-soft text-success", Falha: "bg-destructive/10 text-destructive", Cancelada: "bg-muted text-muted-foreground", Pausada: "bg-warning-soft text-warning" };
const statusIcons: Record<UiStatus, LucideIcon> = { Processando: LoaderCircle, Pendente: Clock3, Concluída: CheckCircle2, Falha: AlertCircle, Cancelada: XCircle, Pausada: CirclePause };
const statusNames: Record<QueueStatus, UiStatus> = { processing: "Processando", pending: "Pendente", completed: "Concluída", failed: "Falha", dead: "Falha", cancelled: "Cancelada" };
const typeNames: Record<string, string> = { album: "Álbum", ep: "EP", single: "Single", music_video: "Vídeo musical", compilation: "Compilação", unknown: "Tipo desconhecido", live: "Álbum ao vivo", playlist: "Playlist", song: "Música" };

const emptyState: MusicState = { wrapper: { running: false, logs: [], needs_2fa: false }, downloader: { running: false, logs: [], needs_selection: false, options: [] }, queue: { items: [], paused: false }, wrapper_installed: true, downloader_installed: true };

function progressOf(item: QueueItem) {
  const value = Number(item.progress);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : item.status === "completed" ? 100 : 0;
}

function mapTaskStatus(status: string): TaskStatus {
  return ({ processing: "Processando", pending: "Pendente", completed: "Concluída", failed: "Falha", dead: "Falha", cancelled: "Cancelada" } as Record<string, TaskStatus>)[status] || "Pendente";
}

function mapBackendTask(item: { id: number; title: string; format: string; status: string; progress: string | number; failed_attempts?: number }): Task {
  const progressText = String(item.progress || "0");
  const progressMatch = progressText.match(/\d+/);
  return { id: item.id, title: item.title || "Download", artist: "Apple Music", format: item.format.toUpperCase() as Task["format"], progress: Number(progressMatch?.[0] || 0), status: mapTaskStatus(item.status), duration: "—", attempt: item.failed_attempts ? `${item.failed_attempts}` : "—" };
}

export function DownloadDashboard() {
<<<<<<< HEAD
  const [state, setState] = useState<MusicState>(emptyState);
  const [connected, setConnected] = useState(false);
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"alac" | "aac" | "atmos">("alac");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
=======
  const [tasks, setTasks] = useState<Task[]>([]);
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<"ALAC" | "AAC" | "Atmos">("ALAC");
>>>>>>> 756da25 (1)
  const [analyzing, setAnalyzing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [selection, setSelection] = useState<{ id: string | null; options: SelectionOption[] } | null>(null);
  const acceptedSelection = useRef<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Todos");
  const [year, setYear] = useState("Todos");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
<<<<<<< HEAD
  const [drawerTask, setDrawerTask] = useState<QueueItem | null>(null);

  const openSelection = useCallback((options: SelectionOption[], id?: string | null) => {
    if (!options.length || (id && acceptedSelection.current === id)) return;
    setSelection({ options, id: id ?? null });
  }, []);
  const refresh = useCallback(async () => {
    try {
      const next = await musicApi.state();
      setState(next); setConnected(true); setNetworkError("");
      if (next.downloader.needs_selection) openSelection(next.downloader.options, next.downloader.selection_id ?? next.downloader.request_id);
      setDrawerTask((current) => current ? next.queue.items.find((item) => item.id === current.id) ?? null : null);
    } catch (error) {
      setConnected(false); setNetworkError(error instanceof Error ? error.message : "Não foi possível conectar ao servidor.");
    }
  }, [openSelection]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 2500);
    const socket = connectMusicSocket({
      onConnect: setConnected,
      onState: (next) => { setState(next); setConnected(true); },
      onQueueChange: () => { void refresh(); },
      onSelection: (data) => openSelection(data.options ?? [], data.selection_id ?? data.request_id),
    });
    return () => { window.clearInterval(timer); socket.disconnect(); };
  }, [openSelection, refresh]);

  const visible = useMemo(() => (selection?.options ?? []).filter((release) => {
    const releaseType = release.kind ?? release.category ?? release.type ?? "unknown";
    const releaseYear = (release.date ?? release.releaseDate ?? "").slice(0, 4);
    return (type === "Todos" || releaseType === type) && (year === "Todos" || releaseYear === year) && `${release.label} ${release.artist ?? release.extra ?? ""}`.toLowerCase().includes(query.toLowerCase());
  }), [query, selection, type, year]);
  const years = useMemo(() => [...new Set((selection?.options ?? []).map((item) => (item.date ?? item.releaseDate ?? "").slice(0, 4)).filter(Boolean))].sort().reverse(), [selection]);

  async function analyze() {
    if (!url.trim()) { setNetworkError("Informe um link do Apple Music."); return; }
    setAnalyzing(true); setNetworkError(""); setMetadata(null);
    try {
      const result = await musicApi.analyze(url.trim());
      if (result.status !== "ok" || !result.metadata) throw new Error(result.message || "O link não pôde ser analisado.");
      setMetadata(result.metadata);
    } catch (error) { setNetworkError(error instanceof Error ? error.message : "Erro ao analisar o link."); }
    finally { setAnalyzing(false); }
  }
  async function addDownload() {
    if (!metadata || adding) return;
    setAdding(true);
    try { await musicApi.download(url, metadata.title ?? "", format); toast.success("Item adicionado à fila."); setMetadata(null); setUrl(""); await refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível adicionar o download."); }
    finally { setAdding(false); }
  }
  async function action(operation: () => Promise<unknown>, message: string) {
    try { await operation(); toast.success(message); await refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "A ação não pôde ser concluída."); }
  }
  async function confirmSelection() {
    if (!selected.length || !selection || sending) return;
    setSending(true); setSubmitError("");
    try {
      const result = await musicApi.submitSelection(selected, selection.id);
      if (!result.accepted) throw new Error(result.message || "Seleção não aceita.");
      acceptedSelection.current = selection.id; setSelection(null); setSelected([]); toast.success(result.message || "Seleção enviada."); await refresh();
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "Não foi possível enviar a seleção."); }
    finally { setSending(false); }
  }
  const items = state.queue.items;
  const totals = { active: items.filter((item) => ["processing", "pending"].includes(item.status)).length, done: items.filter((item) => item.status === "completed").length, failed: items.filter((item) => ["failed", "dead"].includes(item.status)).length, paused: state.queue.paused ? items.filter((item) => item.status === "pending").length : 0 };
=======
  const [networkError, setNetworkError] = useState(false);
  const [queuePaused, setQueuePaused] = useState(false);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [backendError, setBackendError] = useState("");

  const visible = useMemo(() => releases.filter((r) => (type === "Todos" || r.type === type) && (year === "Todos" || String(r.year) === year) && `${r.title} ${r.artist}`.toLowerCase().includes(query.toLowerCase())), [query, type, year]);
  const syncState = async () => {
    try {
      const state = await getBackendState();
      setTasks(state.queue.items.map(mapBackendTask));
      setQueuePaused(state.queue.paused);
      setBackendError("");
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : "Backend indisponível.");
    }
  };
  useEffect(() => {
    void syncState();
    const timer = window.setInterval(() => void syncState(), 2500);
    return () => window.clearInterval(timer);
  }, []);
  const analyze = async () => {
    if (!url.trim()) { setNetworkError(true); return; }
    setNetworkError(false); setAnalyzing(true); setSubmitError("");
    try {
      const result = await analyzeLink(url.trim());
      const metadata = result.metadata || {};
      await addToQueue(url.trim(), format.toLowerCase(), typeof metadata["name"] === "string" ? metadata["name"] : undefined);
      await syncState();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível adicionar o link.");
    } finally {
      setAnalyzing(false);
    }
  };
  const confirm = () => undefined;
  const updateTask = (id: number, status: TaskStatus) => setTasks((items) => items.map((item) => item.id === id ? { ...item, status, progress: status === "Concluída" ? 100 : item.progress } : item));
  const totals = { active: tasks.filter((t) => t.status === "Processando" || t.status === "Pendente").length, done: tasks.filter((t) => t.status === "Concluída").length, failed: tasks.filter((t) => t.status === "Falha").length, paused: tasks.filter((t) => t.status === "Pausada").length };
>>>>>>> 756da25 (1)
  const metrics: Array<{ label: string; value: number; icon: LucideIcon; color: string }> = [
    { label: "Em andamento", value: totals.active, icon: CirclePlay, color: "text-info" }, { label: "Concluídos", value: totals.done, icon: CheckCircle2, color: "text-success" }, { label: "Com falha", value: totals.failed, icon: AlertCircle, color: "text-destructive" }, { label: "Pausados", value: totals.paused, icon: CirclePause, color: "text-warning" },
  ];

  return <TooltipProvider><AppShell eyebrow="Operação ao vivo" title="Fila de downloads" connected={connected}>
    <section className="animate-rise-in border-b border-border pb-7">
<<<<<<< HEAD
      <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="font-display text-lg font-semibold">Adicionar do Apple Music</h2><p className="mt-1 text-sm text-muted-foreground">Cole um link de música, álbum, playlist ou artista.</p></div><span className="hidden text-xs text-muted-foreground lg:block">{connected ? "Servidor sincronizado" : "Aguardando servidor"}</span></div>
      <div className="flex flex-col gap-3 xl:flex-row"><div className="relative flex-1"><Download className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input aria-label="Link do Apple Music" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void analyze()} className="h-12 w-full rounded-md border border-input bg-surface-raised pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="https://music.apple.com/..."/></div><div className="grid h-12 grid-cols-3 rounded-md bg-muted p-1" aria-label="Formato de áudio">{(["alac","aac","atmos"] as const).map((item) => <Button key={item} variant="ghost" onClick={() => setFormat(item)} className={cn("h-10 min-w-20 uppercase shadow-none", format === item && "bg-surface-raised text-primary shadow-sm hover:bg-surface-raised")}>{item}</Button>)}</div><Button onClick={() => void analyze()} disabled={analyzing} className="h-12 min-w-36">{analyzing ? <><LoaderCircle className="animate-spin"/>Analisando</> : <><Search/>Analisar link</>}</Button></div>
      {networkError && <div role="alert" className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4"/>{networkError}</div>}
      {metadata && <div className="mt-4 flex flex-col items-start gap-4 border-t border-border pt-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3">{metadata.image && <img src={metadata.image} alt="" className="size-14 rounded-md object-cover"/>}<div className="min-w-0"><strong className="block truncate">{metadata.title || "Link analisado"}</strong><span className="text-sm text-muted-foreground">{metadata.type || "Apple Music"}</span></div></div><Button onClick={() => void addDownload()} disabled={adding}>{adding ? <LoaderCircle className="animate-spin"/> : <Download/>}{adding ? "Adicionando" : "Adicionar à fila"}</Button></div>}
=======
      <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="font-display text-lg font-semibold">Adicionar do Apple Music</h2><p className="mt-1 text-sm text-muted-foreground">Cole um link de música, álbum, playlist ou artista.</p></div><span className="hidden text-xs text-muted-foreground lg:block">Última sincronização agora</span></div>
      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="relative flex-1"><Download className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input aria-label="Link do Apple Music" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && analyze()} className="h-12 w-full rounded-md border border-input bg-surface-raised pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="https://music.apple.com/..."/></div>
        <div className="grid h-12 grid-cols-3 rounded-md bg-muted p-1" aria-label="Formato de áudio">{(["ALAC","AAC","Atmos"] as const).map((item) => <Button key={item} variant="ghost" onClick={() => setFormat(item)} className={cn("h-10 min-w-20 shadow-none", format === item && "bg-surface-raised text-primary shadow-sm hover:bg-surface-raised")}>{item}{item === "ALAC" && <span className="sr-only">sem perdas</span>}</Button>)}</div>
        <Button onClick={analyze} disabled={analyzing} className="h-12 min-w-36">{analyzing ? <><LoaderCircle className="animate-spin"/>Analisando</> : <><Search/>Analisar link</>}</Button>
      </div>
      {networkError && <div role="alert" className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4"/>Informe um link válido para iniciar a análise.</div>}
      {backendError && <div role="alert" className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4"/>{backendError}</div>}
      {submitError && <div role="alert" className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4"/>{submitError}</div>}
>>>>>>> 756da25 (1)
    </section>
    <section className="grid grid-cols-2 gap-px border-b border-border bg-border py-px lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon, color }) => <div key={label} className="bg-background px-3 py-5 md:px-6"><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Icon className={cn("size-4", color)}/>{label}</div><strong className="mt-2 block font-display text-3xl">{value}</strong></div>)}</section>
<<<<<<< HEAD
    <section className="pt-7"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">Fila atual</h2><p className="text-sm text-muted-foreground">{items.length} tarefas · {items.filter((item) => item.status === "processing").length} em processamento</p></div><Button variant={state.queue.paused ? "default" : "outline"} size="sm" onClick={() => void action(() => musicApi.pause(!state.queue.paused), state.queue.paused ? "Fila retomada." : "Fila pausada.")}>{state.queue.paused ? <><Play/>Retomar fila</> : <><Pause/>Pausar fila</>}</Button></div>{state.queue.paused && <div className="mb-4 flex items-start gap-3 rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning"><CirclePause className="mt-0.5 size-4 shrink-0"/><div><strong>Fila pausada.</strong> Novos itens permanecerão aguardando.</div></div>}{items.length === 0 ? <div className="grid min-h-72 place-items-center border-y border-dashed border-border text-center"><div><Download className="mx-auto mb-3 size-8 text-muted-foreground"/><h3 className="font-display font-semibold">A fila está vazia</h3><p className="mt-1 text-sm text-muted-foreground">Analise um link acima para adicionar músicas.</p></div></div> : <TaskList items={items} paused={state.queue.paused} onOpen={setDrawerTask} onAction={action}/>}</section>
    <ReleaseDialog open={!!selection} onOpenChange={(open) => { if (!open && !sending) setSelection(null); }} query={query} setQuery={setQuery} type={type} setType={setType} year={year} setYear={setYear} years={years} visible={visible} selected={selected} setSelected={setSelected} sending={sending} error={submitError} onConfirm={confirmSelection} onSkip={() => void action(musicApi.skipSelection, "Seleção ignorada.").then(() => setSelection(null))}/>
    <TaskDrawer task={drawerTask} logs={state.downloader.logs} onClose={() => setDrawerTask(null)} onAction={action}/>
=======

    <section className="pt-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">Fila atual</h2><p className="text-sm text-muted-foreground">{tasks.length} tarefas · {tasks.filter(t => t.status === "Processando").length} em processamento</p></div><div className="flex items-center gap-2"><Button variant={queuePaused ? "default" : "outline"} size="sm" onClick={async () => { try { const result = await updateQueuePaused(!queuePaused); setQueuePaused(result.paused); await syncState(); } catch (error) { setBackendError(error instanceof Error ? error.message : "Não foi possível alterar a fila."); } }} >{queuePaused ? <><Play/>Retomar fila</> : <><Pause/>Pausar fila</>}</Button></div></div>
      {queuePaused && <div className="mb-4 flex items-start gap-3 rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning"><CirclePause className="mt-0.5 size-4 shrink-0"/><div><strong>Fila pausada.</strong> Downloads ativos foram interrompidos e novos itens vão aguardar.</div></div>}
      {tasks.length === 0 ? <div className="grid min-h-72 place-items-center border-y border-dashed border-border text-center"><div><Download className="mx-auto mb-3 size-8 text-muted-foreground"/><h3 className="font-display font-semibold">A fila está vazia</h3><p className="mt-1 text-sm text-muted-foreground">Analise um link acima para adicionar músicas.</p></div></div> : <TaskList tasks={tasks} onOpen={setDrawerTask} onUpdate={updateTask}/>} 
    </section>

    <TaskDrawer task={drawerTask} setTask={setDrawerTask} onUpdate={updateTask}/>
>>>>>>> 756da25 (1)
  </AppShell></TooltipProvider>;
}

function StatusBadge({ item, paused }: { item: QueueItem; paused: boolean }) { const status = paused && item.status === "pending" ? "Pausada" : statusNames[item.status]; const Icon = statusIcons[status]; return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold", statusStyles[status])}><Icon className={cn("size-3.5", status === "Processando" && "animate-spin")}/>{status}</span>; }

type ActionFn = (operation: () => Promise<unknown>, message: string) => Promise<void>;
function TaskActions({ item, onOpen, onAction }: { item: QueueItem; onOpen: (item: QueueItem) => void; onAction: ActionFn }) { return <div className="flex justify-end gap-1"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => onOpen(item)}><Eye/><span className="sr-only">Ver detalhes</span></Button></TooltipTrigger><TooltipContent>Ver detalhes</TooltipContent></Tooltip>{item.status === "pending" && <><Button variant="ghost" size="icon" onClick={() => void onAction(() => musicApi.move(item.id, "up"), "Item movido.")} title="Mover para cima"><ArrowUp/></Button><Button variant="ghost" size="icon" onClick={() => void onAction(() => musicApi.move(item.id, "down"), "Item movido.")} title="Mover para baixo"><ArrowDown/></Button></>}{["failed","dead","cancelled"].includes(item.status) && <Button variant="ghost" size="icon" onClick={() => void onAction(() => musicApi.download(item.link, item.title, item.format), "Nova tentativa adicionada.")} title="Tentar novamente"><RotateCcw/></Button>}{["processing","pending"].includes(item.status) && <Button variant="ghost" size="icon" onClick={() => void onAction(() => musicApi.cancel(item.id, item.status), "Item cancelado.")} title="Cancelar"><Trash2/></Button>}</div>; }

function TaskList({ items, paused, onOpen, onAction }: { items: QueueItem[]; paused: boolean; onOpen: (item: QueueItem) => void; onAction: ActionFn }) { return <><div className="hidden overflow-hidden rounded-md border border-border bg-surface-raised lg:block"><table className="w-full table-fixed text-left"><thead className="border-b border-border bg-muted/60 text-[11px] font-bold uppercase text-muted-foreground"><tr><th className="w-[32%] px-4 py-3">Título</th><th className="w-20 px-3">Formato</th><th className="w-[18%] px-3">Progresso</th><th className="w-32 px-3">Status</th><th className="w-20 px-3">Tentativa</th><th className="w-36 px-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-border">{items.map((item) => <tr key={item.id} className="transition-colors hover:bg-muted/40"><td className="px-4 py-3"><Button variant="ghost" className="h-auto max-w-full justify-start p-0 text-left hover:bg-transparent" onClick={() => onOpen(item)}><span className="min-w-0"><strong className="block truncate text-sm font-semibold">{item.title || "Aguardando metadados"}</strong><span className="block truncate text-xs font-normal text-muted-foreground">{item.link}</span></span></Button></td><td className="px-3 text-xs font-bold uppercase">{item.format}</td><td className="px-3"><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{width: `${progressOf(item)}%`}}/></div><span className="w-8 text-right text-xs tabular-nums">{progressOf(item)}%</span></div></td><td className="px-3"><StatusBadge item={item} paused={paused}/></td><td className="px-3 text-xs text-muted-foreground">{Number(item.failed_attempts ?? 0) + 1}</td><td className="px-3"><TaskActions item={item} onOpen={onOpen} onAction={onAction}/></td></tr>)}</tbody></table></div><div className="divide-y divide-border border-y border-border lg:hidden">{items.map((item) => <article key={item.id} className="py-4"><div className="flex items-start justify-between gap-3"><Button variant="ghost" className="h-auto min-w-0 justify-start p-0 text-left hover:bg-transparent" onClick={() => onOpen(item)}><span className="min-w-0"><strong className="block truncate text-sm">{item.title}</strong><span className="block truncate text-xs font-normal text-muted-foreground">{item.link}</span></span></Button><StatusBadge item={item} paused={paused}/></div><div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width: `${progressOf(item)}%`}}/></div><span className="text-xs tabular-nums">{progressOf(item)}%</span></div><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span className="uppercase">{item.format} · tentativa {Number(item.failed_attempts ?? 0) + 1}</span><TaskActions item={item} onOpen={onOpen} onAction={onAction}/></div></article>)}</div></>; }

type DialogProps = { open: boolean; onOpenChange: (value: boolean) => void; query: string; setQuery: (value: string) => void; type: string; setType: (value: string) => void; year: string; setYear: (value: string) => void; years: string[]; visible: SelectionOption[]; selected: string[]; setSelected: (value: string[]) => void; sending: boolean; error: string; onConfirm: () => void; onSkip: () => void };
function ReleaseDialog(props: DialogProps) { const allVisible = props.visible.length > 0 && props.visible.every((release) => props.selected.includes(String(release.id))); const toggleAll = () => props.setSelected(allVisible ? props.selected.filter((id) => !props.visible.some((release) => String(release.id) === id)) : [...new Set([...props.selected, ...props.visible.map((release) => String(release.id))])]); return <Dialog open={props.open} onOpenChange={props.onOpenChange}><DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0"><DialogHeader className="border-b border-border p-5 pr-14"><DialogTitle className="font-display text-xl">Selecionar releases</DialogTitle><DialogDescription>Escolha os itens retornados pelo downloader.</DialogDescription></DialogHeader><div className="grid gap-2 border-b border-border bg-muted/40 p-4 sm:grid-cols-[1fr_180px_130px]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input aria-label="Buscar releases" value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Buscar por título ou artista" className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/20"/></div><select aria-label="Filtrar por tipo" value={props.type} onChange={(event) => props.setType(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Todos</option>{Object.entries(typeNames).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Filtrar por ano" value={props.year} onChange={(event) => props.setYear(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Todos</option>{props.years.map((value) => <option key={value}>{value}</option>)}</select></div><div className="flex items-center justify-between border-b border-border px-5 py-3 text-sm"><Button variant="ghost" onClick={toggleAll} className="text-primary"><span className={cn("grid size-5 place-items-center rounded border", allVisible ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background")}>{allVisible && <Check className="size-3.5"/>}</span>Selecionar resultados visíveis</Button><span className="text-muted-foreground">{props.visible.length} resultados</span></div><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4"><div className="grid gap-2 sm:grid-cols-2">{props.visible.map((release) => { const id=String(release.id); const checked=props.selected.includes(id); const kind=release.kind ?? release.category ?? release.type ?? "unknown"; return <Button key={id} variant="outline" disabled={release.selectable === false} onClick={() => props.setSelected(checked ? props.selected.filter((value) => value !== id) : [...props.selected,id])} className={cn("h-auto min-h-24 items-start justify-start gap-3 whitespace-normal p-3 text-left", checked && "border-primary bg-accent/60")}><span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded border", checked ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{checked&&<Check className="size-3.5"/>}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{release.label}</strong><span className="block truncate text-xs font-normal text-muted-foreground">{release.artist ?? release.extra}</span><span className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground"><span>{release.category_label ?? typeNames[kind]}</span><span>·</span><span>{release.track_count ?? "—"} faixas</span><span>·</span><span>{String(release.duration || "—")}</span></span></span></Button>; })}</div>{props.visible.length===0 && <div className="grid min-h-44 place-items-center text-sm text-muted-foreground">Nenhum release corresponde aos filtros.</div>}</div><div className="border-t border-border bg-background p-4">{props.error&&<div role="alert" className="mb-3 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0"/>{props.error}</div>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-semibold">{props.selected.length} {props.selected.length===1?"item selecionado":"itens selecionados"}</span><div className="flex gap-2"><Button variant="outline" onClick={props.onSkip} disabled={props.sending}>Ignorar</Button><Button onClick={props.onConfirm} disabled={!props.selected.length||props.sending}>{props.sending?<><LoaderCircle className="animate-spin"/>Enviando...</>:<>Confirmar seleção<ChevronRight/></>}</Button></div></div></div></DialogContent></Dialog>; }

function TaskDrawer({ task, logs, onClose, onAction }: { task: QueueItem | null; logs: string[]; onClose: () => void; onAction: ActionFn }) { if (!task) return null; return <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader className="border-b border-border pb-5"><SheetTitle className="pr-8 font-display text-xl">{task.title}</SheetTitle><SheetDescription className="truncate">{task.link}</SheetDescription></SheetHeader><div className="space-y-7 py-6"><div><div className="mb-2 flex items-center justify-between"><StatusBadge item={task} paused={false}/><strong className="text-sm">{progressOf(task)}%</strong></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${progressOf(task)}%`}}/></div></div><div><h3 className="mb-3 text-xs font-bold uppercase text-muted-foreground">Metadados</h3><dl className="grid grid-cols-2 gap-y-3 text-sm"><dt className="text-muted-foreground">Formato</dt><dd className="text-right font-medium uppercase">{task.format}</dd><dt className="text-muted-foreground">Tentativa</dt><dd className="text-right font-medium">{Number(task.failed_attempts ?? 0) + 1}</dd><dt className="text-muted-foreground">Adicionado</dt><dd className="text-right font-medium">{task.created_at ?? "—"}</dd><dt className="text-muted-foreground">Destino</dt><dd className="truncate text-right font-medium">{task.existing_path ?? "Aguardando"}</dd></dl></div><div><h3 className="mb-3 text-xs font-bold uppercase text-muted-foreground">Logs recentes</h3><pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-foreground p-3 font-mono text-[11px] leading-5 text-primary-foreground/75">{logs.slice(-14).join("\n") || "Nenhum log recente."}</pre></div><div className="grid grid-cols-1 gap-2">{["failed","dead","cancelled"].includes(task.status) && <Button onClick={() => void onAction(() => musicApi.download(task.link, task.title, task.format), "Nova tentativa adicionada.").then(onClose)}><RefreshCw/>Tentar novamente</Button>}{["processing","pending"].includes(task.status) && <Button variant="destructive" onClick={() => void onAction(() => musicApi.cancel(task.id, task.status), "Item cancelado.").then(onClose)}><XCircle/>Cancelar</Button>}</div></div></SheetContent></Sheet>; }