import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Download, FolderCog, Headphones, KeyRound, Menu, Plug, Terminal, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBackendState, loginWrapper, submitTwoFactor, stopWrapper, type BackendState } from "@/lib/backend-api";

export function AppShell({ children, title, eyebrow, connected }: { children: ReactNode; title: string; eyebrow: string; connected?: boolean }) {
  const [open, setOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });
  const nav = [
    { to: "/" as const, label: "Downloads", icon: Download },
    { to: "/configuracoes" as const, label: "Configurações", icon: FolderCog },
  ];

  return <div className="min-h-screen bg-background text-foreground">
    {open && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setOpen(false)} />}
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-foreground text-primary-foreground transition-transform md:w-20 md:translate-x-0", open ? "translate-x-0" : "-translate-x-full") }>
      <div className="flex h-20 items-center justify-between border-b border-primary-foreground/15 px-5 md:justify-center md:px-0">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-md bg-primary"><Headphones className="size-5" /></span><span className="font-display text-sm font-semibold md:hidden">Music Download</span></div>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground md:hidden" onClick={() => setOpen(false)}><X/><span className="sr-only">Fechar menu</span></Button>
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-3">
        {nav.map((item) => { const Icon = item.icon; const active = path === item.to; return <Link key={item.to} to={item.to} onClick={() => setOpen(false)} title={item.label} className={cn("flex h-12 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors md:justify-center md:px-0", active ? "bg-primary text-primary-foreground" : "text-primary-foreground/65 hover:bg-primary-foreground/10 hover:text-primary-foreground")}><Icon className="size-5"/><span className="md:hidden">{item.label}</span></Link>})}
      </nav>
       <div className="m-3 flex items-center gap-3 border-t border-primary-foreground/15 pt-4 md:justify-center"><span className={cn("relative size-2 rounded-full", connected ? "bg-success before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-success" : "bg-destructive")}/><span className="text-xs text-primary-foreground/60 md:hidden">{connected ? "Servidor conectado" : "Servidor indisponível"}</span></div>
    </aside>
    <div className="md:pl-20">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3"><Button variant="outline" size="icon" className="md:hidden" onClick={() => setOpen(true)}><Menu/><span className="sr-only">Abrir menu</span></Button><div><p className="text-[11px] font-bold uppercase text-primary">{eyebrow}</p><h1 className="font-display text-xl font-semibold sm:text-2xl">{title}</h1></div></div>
        <button className="hidden items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs font-medium sm:flex" onClick={() => setConnectionOpen(true)}><Activity className="size-4 text-success"/> Backend <span className="text-muted-foreground">Conectar</span></button>
      </header>
      <main className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</main>
    </div>
    <ConnectionDrawer open={connectionOpen} onClose={() => setConnectionOpen(false)} />
  </div>;
}

function ConnectionDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, setState] = useState<BackendState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try { setState(await getBackendState()); setError(""); } catch (problem) { setError(problem instanceof Error ? problem.message : "Backend indisponível."); }
  };
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2500);
    return () => window.clearInterval(timer);
  }, []);
  const connect = async () => {
    setBusy(true); setError("");
    try { await loginWrapper(email, password); setPassword(""); await refresh(); } catch (problem) { setError(problem instanceof Error ? problem.message : "Falha ao conectar o wrapper."); } finally { setBusy(false); }
  };
  const submitCode = async () => {
    setBusy(true); setError("");
    try { await submitTwoFactor(code); setCode(""); await refresh(); } catch (problem) { setError(problem instanceof Error ? problem.message : "Falha ao enviar o código 2FA."); } finally { setBusy(false); }
  };
  if (!open) return null;
  const wrapper = state?.wrapper;
  return <>
    <button className="fixed inset-0 z-40 bg-foreground/30" aria-label="Fechar conexão" onClick={onClose}/>
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-border bg-background p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-primary">Diagnóstico</p><h2 className="font-display text-2xl font-semibold">Wrapper e logs</h2></div><Button variant="ghost" size="icon" onClick={onClose}><X/><span className="sr-only">Fechar</span></Button></div>
      <div className="mb-6 flex items-center justify-between rounded-md border border-border bg-surface-raised p-4"><div className="flex items-center gap-3"><span className={cn("size-3 rounded-full", wrapper?.running ? "bg-success" : "bg-muted-foreground")}/><div><strong>{wrapper?.running ? "Wrapper conectado" : "Wrapper desconectado"}</strong><p className="text-xs text-muted-foreground">Estado atualizado pelo backend</p></div></div>{wrapper?.running && <Button variant="outline" size="sm" onClick={async () => { await stopWrapper(); await refresh(); }}>Parar</Button>}</div>
      {!wrapper?.running && <div className="mb-6 space-y-3 rounded-md border border-border p-4"><div className="flex items-center gap-2 font-semibold"><KeyRound className="size-4 text-primary"/>Login do wrapper</div><input aria-label="Email do wrapper" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email Apple" className="h-10 w-full rounded-md border border-input bg-surface-raised px-3 text-sm"/><input aria-label="Senha do wrapper" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" className="h-10 w-full rounded-md border border-input bg-surface-raised px-3 text-sm"/><Button className="w-full" disabled={busy || !email || !password} onClick={() => void connect()}><Plug/>Conectar</Button></div>}
      {wrapper?.needs_2fa && <div className="mb-6 space-y-3 rounded-md border border-warning/30 bg-warning-soft p-4"><strong>Código de verificação</strong><p className="text-sm text-muted-foreground">Digite o código de 6 dígitos enviado ao dispositivo Apple.</p><input aria-label="Código 2FA" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-center tracking-[0.4em]"/><Button className="w-full" disabled={busy || code.length !== 6} onClick={() => void submitCode()}>Enviar código</Button></div>}
      {error && <p role="alert" className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2"><LogPanel icon={Terminal} title="Wrapper" logs={wrapper?.logs || []}/><LogPanel icon={Activity} title="Downloader" logs={state?.downloader.logs || []}/></div>
    </aside>
  </>;
}

function LogPanel({ icon: Icon, title, logs }: { icon: typeof Activity; title: string; logs: string[] }) {
  return <section><h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Icon className="size-4"/>{title}</h3><pre className="min-h-48 max-h-80 overflow-auto rounded-md bg-foreground p-3 font-mono text-[11px] leading-5 text-primary-foreground/80">{logs.length ? logs.join("\n") : "Nenhum log disponível."}</pre></section>;
}
