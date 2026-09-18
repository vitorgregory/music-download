# Aplicar a revisão de UX ao aplicativo Flask

## Objetivo
Consolidar a experiência operacional diretamente na interface Flask mesclada, mantendo intactos os endpoints, eventos Socket.IO, proteção CSRF, autenticação Apple, fila e configurações existentes.

## Alterações planejadas
- Reorganizar a tela principal em uma navegação lateral compacta, cabeçalho funcional, ferramenta de análise e fila ampla, sem transformar o produto em uma landing page.
- Preservar todos os IDs e formatos de dados usados pelo JavaScript e pelo backend; melhorar apenas a marcação, estilos e apresentação dos estados reais.
- Exibir um resumo operacional da fila e manter a tabela densa no desktop, convertendo cada linha em bloco legível no celular.
- Refinar análise, carregamento, erros, pausa, conexão, logs, login e 2FA com mensagens explícitas e controles desabilitados durante envios.
- Tornar a seleção de artista um modal completo e responsivo, com tipos suportados pelo backend, filtros, contagem, seleção visível e erro persistente até nova ação.
- Adicionar um painel lateral de detalhes da tarefa usando os dados e logs já retornados, sem criar novos contratos de backend; ações disponíveis continuarão chamando as rotas existentes.
- Harmonizar a página de configurações com a mesma navegação e linguagem visual, preservando todas as chaves do arquivo de configuração.

## Compatibilidade técnica
- O Flask continuará servindo `index.html`, `settings.html`, `style.css` e `script.js`.
- Permanecem os contratos `/api/state`, `/analyze_link`, `/download`, controles da fila, login/2FA, seleção e configurações.
- Permanecem o polling de estado e o evento `selection_required` do Socket.IO, incluindo a proteção contra reabertura por evento atrasado.
- O frontend React de demonstração não substituirá nem interceptará o backend Flask.

## Validação
- Executar os testes Python existentes.
- Verificar sintaxe do JavaScript e integridade dos IDs esperados.
- Iniciar o Flask localmente quando possível e testar os fluxos principais em desktop e celular, sem exigir downloads reais.
