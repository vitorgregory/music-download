from pathlib import Path


ROOT = Path(__file__).parents[1]
SRC = ROOT / "src"


def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_download_route_exposes_expected_page_metadata():
    source = read_source("src/routes/index.tsx")

    assert 'createFileRoute("/")' in source
    assert "Fila de downloads" in source
    assert "Music Download" in source
    assert "Apple Music" in source


def test_dashboard_has_core_download_controls():
    source = read_source("src/components/download-dashboard.tsx")

    assert 'aria-label="Link do Apple Music"' in source
    assert 'aria-label="Formato de áudio"' in source
    assert '"ALAC"' in source and '"AAC"' in source and '"Atmos"' in source
    assert 'onKeyDown={(e) => e.key === "Enter" && analyze()}' in source
    assert "Analisar link" in source
    assert 'role="alert"' in source
    assert "Informe um link válido" in source
    assert 'from "@/lib/backend-api"' in source
    assert "getBackendState" in source
    assert "analyzeLink" in source
    assert "addToQueue" in source
    assert "setQueuePaused" in source
    assert "initialTasks" not in source
    assert "window.setTimeout" not in source


def test_release_selection_supports_search_filters_and_queue_submission():
    source = read_source("src/components/download-dashboard.tsx")

    assert 'aria-label="Buscar releases"' in source
    assert 'aria-label="Filtrar por tipo"' in source
    assert 'aria-label="Filtrar por ano"' in source
    assert "addToQueue" in source
    assert "await syncState()" in source
    assert "Não foi possível adicionar o link" in source


def test_queue_covers_expected_statuses_and_actions():
    source = read_source("src/lib/music-data.ts")
    dashboard = read_source("src/components/download-dashboard.tsx")

    for status in ("Processando", "Pendente", "Concluída", "Falha", "Cancelada", "Pausada"):
        assert status in source

    assert "Pausar fila" in dashboard
    assert "Retomar fila" in dashboard
    assert "Tentar novamente" in dashboard
    assert "Ver detalhes" in dashboard


def test_settings_route_and_controls_match_download_preferences():
    route = read_source("src/routes/configuracoes.tsx")
    page = read_source("src/components/settings-page.tsx")

    assert 'createFileRoute("/configuracoes")' in route
    assert "Configurações" in route
    assert 'aria-label="Pasta de saída"' in page
    assert "Tentar novamente após uma falha" in page
    assert 'role="switch"' in page
    assert "Math.max(1" in page
    assert "Math.min(5" in page
    assert "Restaurar padrões" in page
    assert "Salvar alterações" in page
    assert "Preferências salvas" in page
    assert "getConfig" in page
    assert "saveConfig" in page


def test_react_shell_exposes_wrapper_login_two_factor_and_logs():
    source = read_source("src/components/app-shell.tsx")

    assert "loginWrapper" in source
    assert "submitTwoFactor" in source
    assert "stopWrapper" in source
    assert 'aria-label="Email do wrapper"' in source
    assert 'aria-label="Senha do wrapper"' in source
    assert 'aria-label="Código 2FA"' in source
    assert "Wrapper e logs" in source
    assert "Nenhum log disponível" in source


def test_navigation_exposes_downloads_and_settings_routes():
    source = read_source("src/components/app-shell.tsx")

    assert 'to: "/"' in source
    assert 'to: "/configuracoes"' in source
    assert 'label: "Downloads"' in source
    assert 'label: "Configurações"' in source


def test_dashboard_and_settings_are_reachable_from_route_components():
    home = read_source("src/routes/index.tsx")
    settings = read_source("src/routes/configuracoes.tsx")

    assert "DownloadDashboard" in home
    assert "SettingsPage" in settings
    assert SRC.joinpath("components/download-dashboard.tsx").exists()
    assert SRC.joinpath("components/settings-page.tsx").exists()