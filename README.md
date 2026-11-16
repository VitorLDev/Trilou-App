# Trilou

Aplicativo de acompanhamento de viagens metroferroviárias para Fortaleza e região.

## Stack

- React Native
- Expo SDK 58
- TypeScript
- Expo Router
- Expo SQLite

## Funcionalidades atuais

- Fluxo inicial de seleção de linha e destino.
- Dados locais de transporte para Fortaleza.
- Banco SQLite com esquema relacional.
- Simulador de viagem integrado ao algoritmo de identificação de estações.
- Estados de localização: confirmada, estimada e indefinida.
- Alerta visual de preparação para desembarque no simulador.

## Desenvolvimento

```bash
npm install
npx expo start --web --port 8081
```

## Verificação

```bash
npx tsc --noEmit
npx expo-doctor
```

## Status

Esta é uma versão inicial de desenvolvimento. GPS real, serviço Android em segundo plano e notificações nativas ainda serão integrados.