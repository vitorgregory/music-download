# Music Download UX Review

## Objetivo
Construir uma demonstração navegável, responsiva e totalmente local da ferramenta operacional de downloads.

## Entregas
- Dashboard principal com entrada de link, formatos segmentados, métricas e fila em tabela/visual móvel.
- Estados demonstráveis de carregamento, erro de rede, fila pausada e fila vazia.
- Seleção de releases de artista com busca, filtros, seleção múltipla, envio seguro, sucesso e erro acionável.
- Painel lateral de tarefa com metadados, progresso, logs e ações locais.
- Tela de configurações rápidas para formato, pasta e tentativas.
- Navegação compacta e textos em português do Brasil.

## Interações locais
- Analisar links abre a seleção mockada após um estado de carregamento.
- Confirmar adiciona releases à fila; simulação de falha mantém o painel aberto.
- Ações de pausar, retomar, cancelar e tentar novamente atualizam a fila.
- Filtros, busca, seleção visível e preferências funcionam sem APIs.

## Detalhes técnicos
- React/TanStack Start com componentes reutilizáveis e ícones Lucide.
- Tokens semânticos em `src/styles.css`, sem integração de backend ou autenticação.
- Rotas separadas para dashboard e configurações, cada uma com metadados próprios.
- Validação visual em desktop e mobile no preview local.
