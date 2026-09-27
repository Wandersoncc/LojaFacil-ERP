# LojaFácil ERP — Frontend

Frontend web do **LojaFácil ERP**, construído em **Next.js 14 (App Router)**. Conecta-se ao backend NestJS existente e entrega o MVP: autenticação, dashboard, produtos, pedidos e lojas.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + componentes no estilo **shadcn/ui** (Radix UI)
- **TanStack Query (React Query)** — chamadas à API, cache e estados de loading
- **Zustand** (com `persist`) — estado de autenticação
- **Axios** — cliente HTTP com interceptors (Bearer token + tratamento de 401)
- **React Hook Form + Zod** — formulários e validação
- **Sonner** — toasts de sucesso/erro

## Pré-requisitos

- Node.js 18+ (testado com Node 22)
- Backend rodando em `http://localhost:3000` (ver `../backend`)

## Como rodar

```bash
cd frontend

# 1. Instalar dependências
npm install

# 2. Configurar a URL da API (já vem com o padrão)
#    edite .env.local se o backend estiver em outro host/porta
cat .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 3. Ambiente de desenvolvimento
npm run dev
# abre em http://localhost:3001 (ou 3000 se livre)

# Build de produção
npm run build && npm run start
```

> **Dica:** o backend usa a porta 3000. Rode o frontend em outra porta:
> `npm run dev -- -p 3001`

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm run lint` | ESLint |

## Estrutura

```
frontend/
├── app/
│   ├── (auth)/               # login + registro (layout público)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/          # área protegida (AuthGuard)
│   │   ├── layout.tsx        # sidebar + header
│   │   ├── page.tsx          # Dashboard
│   │   ├── products/         # listar, criar, ajustar estoque
│   │   ├── orders/           # listagem unificada + filtros
│   │   ├── stores/           # lojas conectadas + conectar
│   │   └── settings/         # perfil + logout
│   ├── layout.tsx            # root + Providers
│   ├── page.tsx              # redireciona p/ dashboard ou login
│   └── globals.css
├── components/
│   ├── ui/                   # primitivos (button, input, card, dialog, table…)
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── auth-guard.tsx        # proteção de rotas
│   ├── page-header.tsx
│   └── providers.tsx         # QueryClient + Toaster
├── lib/
│   ├── api.ts                # instância axios + interceptors + getErrorMessage
│   ├── services.ts           # funções tipadas por endpoint
│   ├── labels.tsx            # badges e rótulos pt-BR
│   └── utils.ts              # cn, formatCents, formatDate
├── stores/
│   └── auth-store.ts         # zustand persist (tokens)
├── types/
│   └── index.ts
└── .env.local
```

## Integração com a API

Base URL: `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3000/api`). O token é
injetado automaticamente em toda requisição via interceptor do Axios.

| Tela | Endpoints usados |
|---|---|
| Login / Registro | `POST /auth/login`, `POST /auth/register` |
| Dashboard | `GET /orders/dashboard`, `GET /products/low-stock` |
| Produtos | `GET /products`, `POST /products`, `POST /inventory/:id/adjust` |
| Pedidos | `GET /orders` (filtros: plataforma, status, data, paginação) |
| Lojas | `GET /stores`, `GET /stores/available-platforms`, `POST /stores/connect` |

> Nenhum endpoint foi inventado. Todas as telas degradam graciosamente (loading,
> vazio e erro), então o app funciona mesmo com o backend retornando listas vazias.

## Funcionalidades

- ✅ Login, registro e **proteção de rotas** (redireciona para `/login` sem token)
- ✅ Tokens (access + refresh) persistidos; **logout** limpa a sessão
- ✅ Logout automático em respostas `401`
- ✅ Layout responsivo (sidebar recolhível no mobile)
- ✅ Dashboard com cards de vendas (hoje/7d/30d), pedidos por status e estoque baixo
- ✅ Produtos: listar, buscar, criar e ajustar estoque (entrada/saída)
- ✅ Pedidos: listagem unificada com filtros e paginação
- ✅ Lojas: listar conectadas e iniciar o fluxo OAuth de conexão
- ✅ Toasts de sucesso/erro e estados de carregamento em toda a aplicação

Valores monetários são tratados em **centavos** pela API e formatados em BRL no front.
