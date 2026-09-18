# Conectar o frontend novo ao backend music-download

## Objetivo
Substituir os dados simulados do painel React pelos contratos Flask existentes, mantendo o backend e o frontend Flask legado intactos.

## Implementação
- Criar um cliente tipado para `/analyze_link`, `/download`, `/api/state`, controles da fila, seleção e configurações, usando a mesma origem por padrão e uma URL configurável no preview.
- Adaptar o dashboard novo para exibir metadados, tarefas, status, progresso, logs e erros reais retornados pelo backend.
- Conectar o navegador ao Socket.IO para receber seleções de artista e atualizações da fila; manter sincronização periódica como recuperação de conexão e compatibilidade.
- Reutilizar os contratos atuais para pausar, cancelar, reordenar, tentar novamente e confirmar ou ignorar seleções, evitando envios duplicados e eventos atrasados.
- Fazer a tela de configurações carregar e salvar os valores reais aceitos pelo backend.
- Mostrar no cabeçalho o estado real da conexão em vez do indicador simulado.

## Compatibilidade técnica
- O Flask continua responsável pelos downloads, fila, Apple Music, 2FA, CSRF e persistência.
- O frontend usa chamadas HTTP e Socket.IO; nenhuma lógica de download será duplicada no navegador.
- O polling de `/api/state` permanece como fallback para instalações que ainda não emitam todos os eventos em tempo real.

## Validação
- Verificar os tipos e a compilação do frontend.
- Executar testes Python disponíveis e checar os contratos Flask.
- Testar análise, inclusão na fila, progresso, pausa, cancelamento e seleção em desktop e celular quando o backend local estiver disponível.