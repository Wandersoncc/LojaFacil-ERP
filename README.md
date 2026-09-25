# LojaFácil ERP

ERP multicanal **enxuto** para pequenos vendedores de marketplace no Brasil e LatAm.
Foco: **estoque, pedidos e anúncios** para quem vende em 1–5 lojas. Simples, barato, estável.

> Mais leve que ferramentas enterprise por decisão de produto. Veja o escopo em [`docs/01-PRD.md`](docs/01-PRD.md).

## Documentação (entregáveis)

| Doc | Conteúdo |
|---|---|
| [`docs/01-PRD.md`](docs/01-PRD.md) | Requisitos de produto + análise de viabilidade das integrações |
| [`docs/02-Arquitetura.md`](docs/02-Arquitetura.md) | Arquitetura, adapters, fluxos, filas |
| [`docs/03-Modelagem-Dados.md`](docs/03-Modelagem-Dados.md) | Modelo de dados + DDL |
| [`docs/04-Plano-Fases.md`](docs/04-Plano-Fases.md) | MVP → v1.0 → melhorias |
| [`docs/05-Stack-e-Estimativas.md`](docs/05-Stack-e-Estimativas.md) | Stack + estimativa de esforço |
| [`docs/06-Wireframes-Telas.md`](docs/06-Wireframes-Telas.md) | Telas principais (web + PWA) |

## Status dos canais

| Canal | Status | Motivo |
|---|---|---|
| Mercado Livre | ✅ MVP | API oficial madura |
| Shopee | ✅ MVP | Open Platform oficial |
| TikTok Shop | ⏳ Fase 2 | Requer aprovação no Partner Center |
| Shein | ⚠️ Condicional | Sem API oficial de seller pública — só *adapter stub* |

## Esqueleto (backend)

Monólito modular em **NestJS + Prisma + PostgreSQL + BullMQ/Redis**.

```
backend/
├── prisma/schema.prisma          # modelo de dados completo
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/                   # cripto, tenant guard, tipos
│   ├── auth/                     # JWT + refresh
│   ├── stores/                   # lojas conectadas + OAuth
│   ├── products/                 # SKU + estoque
│   ├── orders/                   # pedidos unificados
│   ├── inventory/                # sync de estoque (âncora)
│   └── integrations/             # adapters por marketplace
│       ├── marketplace-adapter.interface.ts
│       ├── meli/                 # Mercado Livre (MVP)
│       ├── shopee/               # Shopee (MVP)
│       ├── tiktok/               # stub (fase 2)
│       └── shein/                # stub (condicional)
```

### Rodar (após instalar deps)
```bash
cd backend
cp .env.example .env      # preencha DB, REDIS, chaves OAuth
npm install
npx prisma migrate dev
npm run start:dev
```

### Endpoints já implementados (MVP)

Todos sob o prefixo `/api`. Rotas de negócio exigem `Authorization: Bearer <accessToken>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria tenant + usuário OWNER + plano free |
| POST | `/api/auth/login` | Login (retorna access + refresh token) |
| GET | `/api/stores` | Lista lojas conectadas (sem expor tokens) |
| GET | `/api/stores/available-platforms` | Canais habilitados p/ conexão |
| POST | `/api/stores/connect` | Inicia OAuth (retorna authUrl) |
| DELETE | `/api/stores/:id` | Desconecta loja |
| POST | `/api/products` | Cadastra produto/SKU |
| GET | `/api/products` | Lista produtos (busca por SKU/título) |
| GET | `/api/products/low-stock` | Produtos com estoque baixo |
| GET | `/api/products/:id` | Detalhe do produto |
| PATCH | `/api/products/:id` | Edita produto |
| POST | `/api/inventory/:productId/adjust` | Entrada/saída manual de estoque |
| GET | `/api/inventory/:productId/movements` | Histórico de movimentações |
| GET | `/api/orders` | Listagem unificada + filtros (loja, plataforma, status, data) |
| GET | `/api/orders/dashboard` | Vendas 1/7/30 dias + pedidos por status |
| GET | `/api/orders/:id` | Detalhe do pedido |

O **anti-overselling** está implementado no `InventoryService` (reserva/liberação/baixa
transacional com `stockAvailable`/`stockReserved` e auditoria em `StockMovement`).
As chamadas HTTP concretas dos adapters ML/Shopee (OAuth, fetchOrders, updateStock)
são o próximo passo — a estrutura e os contratos já estão prontos.

### Seed de planos
```bash
npx prisma migrate dev      # cria as tabelas
npm run prisma:seed         # cria os planos free/basic/pro
```

> Este repositório entrega a **documentação completa** + o **backend do MVP** com módulos
> funcionais (auth, stores, products, inventory, orders) e os adapters de marketplace.
> Segue o plano em `docs/04`.
