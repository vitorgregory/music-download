import { createFileRoute } from "@tanstack/react-router";
import { DownloadDashboard } from "@/components/download-dashboard";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Fila de downloads — Music Download" },
    { name: "description", content: "Gerencie downloads do Apple Music em ALAC, AAC e Atmos." },
    { property: "og:title", content: "Fila de downloads — Music Download" },
    { property: "og:description", content: "Gerencie downloads do Apple Music em ALAC, AAC e Atmos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: DownloadDashboard,
});
