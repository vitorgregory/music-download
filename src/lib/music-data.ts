export type TaskStatus = "Processando" | "Pendente" | "Concluída" | "Falha" | "Cancelada" | "Pausada";
export type Task = { id: number; title: string; artist: string; format: "ALAC" | "AAC" | "Atmos"; progress: number; status: TaskStatus; duration: string; attempt: string };
export const initialTasks: Task[] = [
  { id: 1, title: "BRAT", artist: "Charli xcx", format: "ALAC", progress: 68, status: "Processando", duration: "41:23", attempt: "1/3" },
  { id: 2, title: "COWBOY CARTER", artist: "Beyoncé", format: "Atmos", progress: 0, status: "Pendente", duration: "1:18:00", attempt: "—" },
  { id: 3, title: "Hit Me Hard and Soft", artist: "Billie Eilish", format: "ALAC", progress: 100, status: "Concluída", duration: "43:45", attempt: "1/3" },
  { id: 4, title: "Imaginal Disk", artist: "Magdalena Bay", format: "AAC", progress: 42, status: "Falha", duration: "53:04", attempt: "2/3" },
  { id: 5, title: "GNX", artist: "Kendrick Lamar", format: "ALAC", progress: 18, status: "Cancelada", duration: "44:20", attempt: "1/3" },
  { id: 6, title: "Charm", artist: "Clairo", format: "Atmos", progress: 35, status: "Pausada", duration: "38:52", attempt: "1/3" },
];
export type Release = { id: number; title: string; artist: string; type: string; year: number; tracks: number; duration: string };
export const releases: Release[] = [
  { id: 101, title: "Hyperdrama", artist: "Justice", type: "Álbum", year: 2024, tracks: 13, duration: "49 min" },
  { id: 102, title: "Woman Worldwide", artist: "Justice", type: "Álbum", year: 2018, tracks: 15, duration: "1 h 24 min" },
  { id: 103, title: "Audio, Video, Disco", artist: "Justice", type: "Álbum", year: 2011, tracks: 11, duration: "46 min" },
  { id: 104, title: "Planisphère", artist: "Justice", type: "EP", year: 2022, tracks: 4, duration: "17 min" },
  { id: 105, title: "One Night/All Night", artist: "Justice & Tame Impala", type: "Single", year: 2024, tracks: 1, duration: "4 min" },
  { id: 106, title: "Neverender", artist: "Justice & Tame Impala", type: "Single", year: 2024, tracks: 2, duration: "8 min" },
  { id: 107, title: "Generator", artist: "Justice", type: "Single", year: 2024, tracks: 1, duration: "4 min" },
  { id: 108, title: "IRIS: A Space Opera", artist: "Justice", type: "Vídeo musical", year: 2019, tracks: 1, duration: "62 min" },
  { id: 109, title: "Ed Rec Vol. X", artist: "Vários artistas", type: "Compilação", year: 2017, tracks: 17, duration: "1 h 8 min" },
  { id: 110, title: "Live at Accor Arena", artist: "Justice", type: "Tipo desconhecido", year: 2025, tracks: 16, duration: "1 h 31 min" },
];