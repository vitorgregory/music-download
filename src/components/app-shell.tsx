import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Download, FolderCog, Headphones, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow: string }) {
  const [open, setOpen] = useState(false);
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
      <div className="m-3 flex items-center gap-3 border-t border-primary-foreground/15 pt-4 md:justify-center"><span className="relative size-2 rounded-full bg-success before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-success"/><span className="text-xs text-primary-foreground/60 md:hidden">Servidor conectado</span></div>
    </aside>
    <div className="md:pl-20">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3"><Button variant="outline" size="icon" className="md:hidden" onClick={() => setOpen(true)}><Menu/><span className="sr-only">Abrir menu</span></Button><div><p className="text-[11px] font-bold uppercase text-primary">{eyebrow}</p><h1 className="font-display text-xl font-semibold sm:text-2xl">{title}</h1></div></div>
        <div className="hidden items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs font-medium sm:flex"><Activity className="size-4 text-success"/> Socket ativo <span className="text-muted-foreground">18 ms</span></div>
      </header>
      <main className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</main>
    </div>
  </div>;
}