import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings-page";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [
    { title: "Configurações — Music Download" },
    { name: "description", content: "Preferências de formato, destino e tentativas dos downloads." },
    { property: "og:title", content: "Configurações — Music Download" },
    { property: "og:description", content: "Preferências de formato, destino e tentativas dos downloads." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: SettingsPage,
});