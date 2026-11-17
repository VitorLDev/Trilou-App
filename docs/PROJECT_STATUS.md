# TRILOU — Documentação e acompanhamento

> Documento vivo do projeto. Atualize esta página ao concluir cada etapa.
>
> Última revisão: 17/11/2026

## 1. Resumo executivo

O TRILOU é um aplicativo Android de acompanhamento de viagens metroferroviárias. A primeira versão deve atender Fortaleza e região, permitir viagens sem login e priorizar a confiabilidade da identificação da estação atual e do alerta de desembarque.

### Status atual

**Protótipo navegável com simulação local.**

Já existe:

- projeto Expo/React Native/TypeScript;
- navegação inicial;
- tema escuro padrão e tema claro alternável;
- banco SQLite local;
- dados iniciais de linhas e estações;
- fluxo de seleção de linha e destino;
- simulador de viagem;
- estrutura inicial de StationMatcher.

Ainda não existe:

- GPS real integrado;
- serviço Android em primeiro plano;
- notificação nativa de desembarque;
- histórico persistido de viagens;
- build Android de desenvolvimento;
- build Android de produção.

## 2. Objetivo do produto

Ajudar o passageiro a acompanhar automaticamente sua viagem e receber um alerta confiável antes da estação de desembarque.

O usuário deve conseguir:

1. abrir o aplicativo;
2. selecionar a linha;
3. selecionar a estação de destino;
4. iniciar o acompanhamento;
5. visualizar a estação atual, a próxima estação e o trajeto;
6. receber o alerta de desembarque no momento correto.

O usuário não deverá precisar informar manualmente cada estação durante a viagem.

## 3. Público-alvo

- passageiros habituais de metrô e VLT;
- usuários ocasionais;
- turistas;
- pessoas que não conhecem a rede;
- passageiros que desejam não perder a estação de desembarque.

## 4. Decisões iniciais

- cidade inicial: Fortaleza;
- idioma inicial: português brasileiro;
- login opcional;
- dados locais por padrão;
- processamento de localização preferencialmente no dispositivo;
- funcionamento offline para o fluxo principal;
- arquitetura preparada para novas cidades;
- interface com estados claros de localização;
- dados de transporte obrigatórios e rastreáveis.

## 5. Arquitetura técnica

### Stack atual

- React Native;
- Expo SDK 58;
- TypeScript;
- Expo Router;
- Expo SQLite;
- React Native Safe Area Context;
- Expo Status Bar.

### Camadas

```text
src/
├── app/
├── application/
├── domain/
├── infrastructure/
└── theme/
```

### Responsabilidades

- `src/app`
  - telas;
  - navegação;
  - apresentação;
  - estados visuais.
- `src/application`
  - casos de uso;
  - coordenação de viagem;
  - simulador.
- `src/domain`
  - entidades;
  - regras;
  - StationMatcher;
  - regras de destino.
- `src/infrastructure`
  - SQLite;
  - consultas;
  - seed;
  - persistência;
  - futuras integrações nativas.
- `src/theme`
  - tema claro;
  - tema escuro;
  - persistência da preferência visual.

## 6. Funcionalidades implementadas

### Interface

- tela inicial modernizada;
- tema escuro;
- alternância para tema claro;
- preferência de tema persistida;
- lista de linhas;
- seleção de sentido;
- busca de estação;
- seleção de destino;
- tela de acompanhamento;
- alerta visual de desembarque no simulador.

### Dados locais

- Fortaleza cadastrada;
- linhas iniciais configuradas;
- estações com coordenadas;
- associação linha/estação/sentido;
- tabelas SQLite para cidades, linhas, estações, viagens, horários, calendários e versões de dados.

### Simulação

- avanço entre estações;
- cenário normal;
- cenário GPS fraco;
- cenário túnel;
- atualização de estação atual;
- atualização de próxima estação;
- cálculo de estações restantes;
- cálculo de confiança;
- alerta único de desembarque.

## 7. Pendências de produto

- [ ] tela de boas-vindas;
- [ ] tela de login opcional;
- [ ] tela de recuperação de senha;
- [ ] tela de histórico;
- [ ] tela de configurações;
- [ ] tela de privacidade;
- [ ] tela sobre o aplicativo;
- [ ] tela de destino próximo;
- [ ] tela de viagem concluída.

## 8. Pendências técnicas

- [ ] integrar GPS real;
- [ ] integrar permissões;
- [ ] integrar serviço de localização em primeiro plano;
- [ ] integrar notificações nativas;
- [ ] implementar recuperação de viagem ativa;
- [ ] implementar histórico local;
- [ ] criar simulador avançado de GPS;
- [ ] criar testes automatizados;
- [ ] criar development build Android;
- [ ] criar build de produção;
- [ ] publicar na Google Play.

## 9. Dados de transporte

### Fontes oficiais

- Metrofor GTFS:
  - https://www.ce.gov.br/metrofor/gtfs/
  - endpoint de download investigado: https://info.metrofor.ce.gov.br/gtfs_file
- Fortaleza em Mapas:
  - https://mapas.fortaleza.ce.gov.br/mapa/340/estacoes-de-metro-e-vlt
  - GeoJSON: https://mapas.fortaleza.ce.gov.br/api/download/geojson/340

### Situação da importação

- GTFS oficial baixado e inspecionado.
- GeoJSON oficial baixado e inspecionado.
- dados iniciais preparados para uso local.
- importação definitiva ainda precisa de reconciliação e testes.

### Arquivos GTFS encontrados

- `agency.txt`
- `calendar.txt`
- `calendar_dates.txt`
- `feed_info.txt`
- `routes.txt`
- `stops.txt`
- `stop_times.txt`
- `trips.txt`

### Arquivos GTFS não encontrados

- `shapes.txt`
- `transfers.txt`

### Divergências conhecidas

- diferenças de nomes entre GTFS e GeoJSON;
- estações compartilhadas entre linhas;
- estações em municípios diferentes de Fortaleza;
- necessidade de validar sequência oficial por sentido;
- necessidade de validar status operacional.

### Regra obrigatória

Não cadastrar estações, coordenadas, linhas ou horários fictícios como dados oficiais. Toda divergência deve ser registrada e resolvida com fonte verificável.

## 10. Algoritmo de localização

### Conceito

O StationMatcher deve combinar:

- precisão do GPS;
- coordenadas das estações;
- sequência oficial da linha;
- sentido da viagem;
- histórico recente;
- velocidade e deslocamento;
- consistência temporal.

### Estados de localização

- `CONFIRMADO`: evidências suficientes para identificar a estação.
- `ESTIMADO`: posição estimada, mas sem confirmação suficiente.
- `INDEFINIDO`: não há evidência suficiente.

### Regras mínimas

- não trocar de estação por uma única leitura ruim;
- não usar somente a estação mais próxima;
- aplicar histerese;
- preservar o último estado confiável;
- não avançar várias estações por salto de GPS;
- não presumir embarque na primeira estação da linha;
- considerar viagem iniciada entre estações;
- manter confiança de 0 a 100;
- tornar limites configuráveis e testáveis.

## 11. GPS real

### Etapa a executar

1. instalar `expo-location` com versão compatível;
2. solicitar permissão em primeiro plano;
3. explicar a finalidade da localização;
4. obter coordenadas;
5. obter precisão;
6. obter timestamp;
7. descartar leituras inconsistentes;
8. integrar ao StationMatcher;
9. tratar permissão negada;
10. tratar GPS desativado;
11. tratar perda e recuperação de sinal;
12. persistir estado da viagem ativa;
13. recuperar viagem após reabrir o app.

## 12. Serviço Android

Requisitos:

- serviço de acompanhamento em primeiro plano;
- notificação persistente;
- funcionamento em segundo plano;
- funcionamento com tela bloqueada nos cenários suportados;
- encerramento do serviço ao finalizar viagem;
- remoção da notificação persistente;
- documentação das limitações de fabricantes Android;
- não prometer rastreamento após encerramento forçado do app.

## 13. Notificação de desembarque

O alerta deve ser emitido quando:

- a próxima estação for o destino;
- a localização tiver confiança suficiente;
- o alerta ainda não tiver sido enviado naquela viagem.

Requisitos:

- notificação local;
- funcionamento offline;
- som configurável;
- vibração configurável;
- prevenção de duplicidade;
- tratamento de incerteza.

## 14. Histórico de viagens

Dados previstos:

- linha;
- estação de origem;
- estação de destino;
- sentido;
- data de início;
- data de encerramento;
- duração, quando calculável;
- status da viagem.

## 15. Login opcional

O login não pode bloquear o fluxo principal.

Regras:

- viagem sem conta;
- cadastro discreto;
- não armazenar senha em texto aberto;
- proteger sessão e tokens;
- permitir exclusão de conta;
- permitir exclusão de dados;
- sincronização futura opcional.

## 16. Privacidade e segurança

- solicitar apenas permissões necessárias;
- explicar uso da localização;
- processar localização localmente;
- não transmitir coordenadas continuamente por padrão;
- não compartilhar histórico sem autorização;
- não publicar credenciais ou keystore;
- documentar política de privacidade.

## 17. Checklist de desenvolvimento

### Etapa 1 — Organização

- [x] criar projeto;
- [x] configurar TypeScript;
- [x] configurar Expo Router;
- [x] criar estrutura em camadas;
- [x] publicar código no GitHub.

### Etapa 2 — Interface

- [x] criar tema escuro;
- [x] criar tema claro;
- [x] persistir tema;
- [x] criar fluxo inicial;
- [ ] revisar acessibilidade;
- [ ] revisar telas em dispositivos pequenos.

### Etapa 3 — Dados

- [x] baixar fontes oficiais;
- [x] inspecionar GTFS;
- [x] inspecionar GeoJSON;
- [ ] resolver divergências;
- [ ] validar sequência oficial;
- [ ] criar relatório de inconsistências;
- [ ] testar importação.

### Etapa 4 — Viagem

- [x] selecionar linha;
- [x] selecionar sentido;
- [x] selecionar destino;
- [ ] impedir destinos inválidos de forma robusta;
- [ ] tratar estações compartilhadas;
- [ ] exibir histórico;
- [ ] encerrar viagem;
- [ ] salvar viagem.

### Etapa 5 — GPS

- [ ] instalar Expo Location;
- [ ] solicitar permissão;
- [ ] obter GPS;
- [ ] integrar ao matcher;
- [ ] testar perda de sinal;
- [ ] testar recuperação;
- [ ] testar túnel.

### Etapa 6 — Android

- [ ] configurar permissões;
- [ ] criar foreground service;
- [ ] criar notificação persistente;
- [ ] testar tela bloqueada;
- [ ] testar segundo plano;
- [ ] criar development build.

### Etapa 7 — Notificação

- [ ] configurar Expo Notifications;
- [ ] criar alerta;
- [ ] configurar som;
- [ ] configurar vibração;
- [ ] evitar duplicidade;
- [ ] testar notificação.

### Etapa 8 — Testes

- [ ] configurar Jest;
- [ ] testar importação;
- [ ] testar ordenação;
- [ ] testar matcher;
- [ ] testar GPS;
- [ ] testar destino;
- [ ] testar notificação;
- [ ] testar offline;
- [ ] testar histórico.

### Etapa 9 — Build

- [ ] definir package name;
- [ ] definir versão;
- [ ] configurar ícone;
- [ ] configurar splash;
- [ ] gerar development build;
- [ ] testar em Android físico;
- [ ] gerar build de produção;
- [ ] criar keystore;
- [ ] configurar assinatura;
- [ ] gerar AAB.

### Etapa 10 — Publicação

- [ ] revisar código;
- [ ] executar typecheck;
- [ ] executar testes;
- [ ] revisar permissões;
- [ ] revisar privacidade;
- [ ] criar capturas;
- [ ] criar descrição;
- [ ] configurar Google Play Console;
- [ ] enviar faixa interna;
- [ ] testar faixa interna;
- [ ] solicitar revisão;
- [ ] publicar produção.

## 18. Critérios de aceite da primeira versão

A primeira versão só será considerada funcional quando:

1. o usuário conseguir acessar sem criar conta;
2. conseguir selecionar uma linha válida;
3. conseguir selecionar um destino válido;
4. conseguir iniciar viagem;
5. conseguir identificar automaticamente a estação em condições adequadas;
6. exibir corretamente a sequência de estações;
7. atualizar a próxima estação durante o deslocamento;
8. reconhecer o destino;
9. disparar uma única notificação de desembarque;
10. funcionar em segundo plano e tela bloqueada nos cenários suportados;
11. funcionar offline com dados já instalados;
12. permitir encerrar viagem;
13. passar nos testes principais;
14. não apresentar dados fictícios como oficiais.

## 19. Riscos

- dados oficiais incompletos;
- divergência entre GTFS e GeoJSON;
- limitações do GPS em túneis;
- diferenças de comportamento entre fabricantes Android;
- limitações de segundo plano;
- Expo Go não validar recursos nativos;
- necessidade de aparelho físico para validação real.

## 20. Registro de decisões

Use esta seção para registrar decisões importantes.

### 17/11/2026

- tema escuro definido como padrão;
- tema claro disponibilizado;
- simulador local mantido para validação inicial;
- GPS real considerado próxima prioridade técnica.

### 16/11/2026

- projeto Expo inicial criado;
- SQLite local configurado;
- fluxo inicial de viagem criado;
- repositório publicado no GitHub.

## 21. Histórico de versões

### v0.1.0 — Protótipo inicial

- interface inicial;
- fluxo de linha e destino;
- dados locais iniciais;
- simulador local.

### v0.2.0 — Interface moderna

- tema escuro padrão;
- tema claro;
- persistência de tema;
- layout reformulado.

## 22. Próxima ação

A próxima ação recomendada é iniciar a **Fase 5 — GPS real**, começando pela instalação e configuração do Expo Location, sem substituir o simulador existente.

### Objetivo da próxima etapa

Transformar o acompanhamento simulado em uma leitura GPS real, preservando:

- ausência de login obrigatório;
- processamento local;
- estados claros de localização;
- última posição confiável;
- recuperação após reabrir o app.

## 23. Como atualizar este documento

Ao concluir uma tarefa:

1. marque o item no checklist;
2. registre a data;
3. descreva o que foi feito;
4. registre arquivos alterados;
5. registre testes executados;
6. registre pendências encontradas;
7. atualize o histórico de versões;
8. envie a alteração para o GitHub.

### Modelo de registro

```text
### DD/MM/AAAA

Feito:
- item concluído.

Arquivos:
- caminho do arquivo.

Testes:
- comando executado;
- resultado.

Problemas:
- problema encontrado.

Próxima etapa:
- ação seguinte.
```