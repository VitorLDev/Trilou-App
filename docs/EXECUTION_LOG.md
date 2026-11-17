# TRILOU — Histórico de execução

Este arquivo registra o progresso de desenvolvimento de forma cronológica. O documento principal de acompanhamento está em `docs/PROJECT_STATUS.md`.

## Como registrar uma etapa

Copie o modelo abaixo para uma nova seção.

```markdown
## DD/MM/AAAA — Título da etapa

### Objetivo

Descreva o objetivo.

### Implementado

- item 1
- item 2

### Arquivos alterados

- `caminho/do/arquivo`

### Testes executados

- `comando`
- resultado

### Problemas encontrados

- problema
- impacto
- solução

### Próxima etapa

- ação
```

## 16/11/2026 — Criação e publicação inicial

### Implementado

- projeto Expo com TypeScript;
- Expo Router;
- SQLite local;
- fluxo inicial de linha e destino;
- estrutura em camadas;
- publicação no GitHub.

### Arquivos principais

- `package.json`
- `app.json`
- `src/app/index.tsx`
- `src/infrastructure/database/`
- `README.md`

### Resultado

Protótipo inicial publicado.

## 16/11/2026 — Simulador e estados de viagem

### Implementado

- simulador de viagem;
- integração com StationMatcher;
- estados confirmado, estimado e indefinido;
- alerta visual de desembarque no simulador.

### Arquivos principais

- `src/application/trip_simulator.ts`
- `src/domain/station_matcher.ts`
- `src/app/index.tsx`

### Resultado

Simulação local funcionando.

## 16/11/2026 — Modernização visual

### Implementado

- layout modernizado;
- identidade visual inicial;
- cards e estados visuais.

### Resultado

Interface inicial reformulada.

## 17/11/2026 — Tema escuro e claro

### Implementado

- tema escuro padrão;
- tema claro alternável;
- persistência da preferência visual;
- nova paleta tecnológica.

### Arquivos principais

- `src/theme/theme.ts`
- `src/infrastructure/storage/theme_storage.ts`
- `src/app/index.tsx`

### Publicação

Commit publicado na branch `main`.

## 17/11/2026 — Documentação de acompanhamento

### Implementado

- documentação central do projeto;
- checklist de desenvolvimento;
- registro de decisões;
- histórico de versões;
- riscos e critérios de aceite.

### Arquivos principais

- `docs/PROJECT_STATUS.md`
- `docs/EXECUTION_LOG.md`

### Próxima etapa

GPS real e serviço Android de acompanhamento.