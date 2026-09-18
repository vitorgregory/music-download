# Music Flow Review

Crie um projeto chamado "Music Download UX Review" para revisar e melhorar a UX/usabilidade do aplicativo music-download existente.

Contexto do produto:
- É uma ferramenta web para baixar músicas do Apple Music em ALAC, AAC e Atmos.
- O fluxo principal é: colar link do Apple Music, analisar, escolher formato, adicionar à fila, acompanhar progresso e resolver seleções de artista/álbum.
- O projeto atual usa Flask + Socket.IO no backend e uma interface de fila de downloads.

Objetivo desta primeira versão:
Construir uma experiência de revisão de UX navegável e polida, usando dados mockados no frontend. Não precisa integrar APIs reais nem autenticação. O produto deve parecer uma ferramenta operacional real, não uma landing page.

Fluxos obrigatórios:
1. Dashboard principal de downloads:
   - Campo de URL com ação clara de analisar.
   - Seleção de formato ALAC/AAC/Atmos com controle segmentado.
   - Resumo da fila com downloads ativos, concluídos, falhos e pausados.
   - Tabela densa e escaneável, com título, artista, formato, progresso, status, duração, tentativa e ações.
   - Estados vazios, loading, erro de rede e fila pausada.
2. Fluxo de link de artista:
   - Ao analisar um link de artista, abrir um painel/modal de seleção com releases.
   - Mostrar categorias vindas do backend: Álbum, EP, Single, Vídeo musical, Compilação e Tipo desconhecido.
   - Exibir track_count e duração total em cada release.
   - Filtros por tipo, ano e busca textual.
   - Seleção múltipla, marcar todos os resultados visíveis e contador de itens.
   - Confirmar deve desabilitar o botão durante o envio, impedir duplo clique e fechar o modal quando aceito.
   - Em erro de validação/rede, o modal deve permanecer aberto com mensagem acionável.
   - Uma seleção aceita não pode reabrir por causa de polling atrasado.
3. Detalhes de uma tarefa:
   - Drawer ou painel lateral com logs recentes, progresso, metadados e ações pausar/cancelar/re tentar.
4. Configurações rápidas:
   - Preferências de formato, pasta de saída e comportamento de retry, em uma tela acessível pelo menu.

Direção visual:
- Interface operacional contemporânea, com personalidade e excelente hierarquia visual.
- Evite aparência genérica de dashboard SaaS e não faça hero de marketing.
- Use tipografia expressiva e legível, boa densidade para uso repetido, cores com contraste sem cair em roxo padrão ou dark mode genérico.
- Use uma composição clara com navegação lateral compacta, cabeçalho funcional e conteúdo principal amplo.
- Use cards apenas para métricas ou ferramentas realmente enquadradas; a fila deve ser uma tabela, não uma grade de cards.
- Inclua ícones Lucide nos botões, tooltips para ícones pouco óbvios, estados hover/focus/disabled e transições discretas de entrada.
- Garanta responsividade real para desktop e mobile: tabela deve virar layout empilhado legível em telas estreitas, sem overflow quebrado.
- Todo texto da interface deve estar em português do Brasil.

Dados mockados:
- Inclua pelo menos 6 tarefas em estados variados: processando, pendente, concluída, falha recuperável, cancelada e pausada.
- Inclua pelo menos 10 releases de artista com combinações de álbum, EP, single, vídeo musical, compilação e desconhecido; use contagens e durações plausíveis.
- Faça os controles funcionarem localmente: analisar link alterna entre estado de análise e abre a seleção; confirmar fecha e adiciona itens à fila; falhar simula erro mantendo o modal; busca/filtros e ações da fila devem funcionar.

Critérios de aceitação:
- Primeira tela já é o dashboard utilizável.
- Nenhum botão principal é apenas decorativo.
- Modal de seleção tem ciclo completo de abrir, selecionar, confirmar, sucesso e erro.
- O estado de envio é explícito e evita submissão duplicada.
- A interface comunica claramente o que está acontecendo sem depender apenas de cor.
- Código organizado em componentes reutilizáveis e tokens de design consistentes.
- Ao terminar, deixe o preview funcionando e pronto para inspeção visual.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/28ade9c0-1b89-4e90-9333-bb4b73a169aa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
