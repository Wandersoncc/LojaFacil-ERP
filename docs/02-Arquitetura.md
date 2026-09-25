# LojaFácil ERP — Arquitetura do Sistema

> Objetivo: arquitetura **modular, simples de manter e barata de rodar**. Um monólito modular (NestJS) + workers de fila. Nada de microsserviços prematuros.

---

## 1. Visão em Camadas

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTES                                │
│   Web App (Next.js)          PWA Mobile (mesmo front, responsivo)│
└───────────────┬──────────────────────────────┬────────────────┘
                │ HTTPS / REST + JWT             │
┌───────────────▼──────────────────────────────▼────────────────┐
│                    API (NestJS - Monólito Modular)             │
│                                                                │
│  Auth  │ Stores │ Products │ Orders │ Inventory │ Reports │... │
│  ───────────────────────────────────────────────────────────  │
│              CAMADA DE INTEGRAÇÃO (Marketplace Adapters)       │
│   ┌────────────┬────────────┬────────────┬────────────────┐   │
│   │ MELI       │ Shopee     │ TikTokShop │ Shein (stub)   │   │
│   │ Adapter    │ Adapter    │ Adapter    │ Adapter        │   │
│   └────────────┴────────────┴────────────┴────────────────┘   │
│         implementam a interface MarketplaceAdapter            │
└───────┬───────────────────────┬──────────────────┬────────────┘
        │                       │                  │
┌───────▼───────┐      ┌────────▼────────┐   ┌─────▼─────────────┐
│  PostgreSQL   │      │  Redis          │   │  Serviços externos │
│ (multi-tenant)│      │  (fila + cache) │   │  ML / Shopee /     │
└───────────────┘      └────────┬────────┘   │  Melhor Envio /    │
                                │            │  Focus NFe         │
                       ┌────────▼────────┐   └───────────────────┘
                       │ WORKERS (BullMQ)│
                       │ sync estoque,   │
                       │ import pedidos, │
                       │ webhooks, NF-e  │
                       └─────────────────┘
```

**Por que monólito modular?** Para o público-alvo e o custo-alvo (< US$100/mês), microsserviços seriam over-engineering. Cada módulo NestJS tem fronteira clara; se um dia precisar escalar, extrai-se um módulo (ex.: workers) sem reescrever.

---

## 2. Padrão-chave: Marketplace Adapter

Toda plataforma implementa a mesma interface. O core **nunca** conhece detalhes de ML ou Shopee — só a interface. É isso que mantém o sistema leve e permite plugar/desplugar canais.

```ts
interface MarketplaceAdapter {
  readonly platform: Platform;                 // MELI | SHOPEE | TIKTOK | SHEIN
  // OAuth
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<TokenSet>;
  refreshToken(refresh: string): Promise<TokenSet>;
  // Produtos
  publishListing(store: StoreCtx, listing: ListingInput): Promise<ExternalId>;
  updateStock(store: StoreCtx, sku: string, qty: number): Promise<void>;
  updatePrice(store: StoreCtx, extId: string, price: number): Promise<void>;
  // Pedidos
  fetchOrders(store: StoreCtx, since: Date): Promise<NormalizedOrder[]>;
  markShipped(store: StoreCtx, orderId: string, tracking?: Tracking): Promise<void>;
  // Mensagens
  fetchMessages?(store: StoreCtx, since: Date): Promise<NormalizedMessage[]>;
  replyMessage?(store: StoreCtx, threadId: string, text: string): Promise<void>;
  // Webhooks
  verifyWebhook(headers, body): boolean;
  parseWebhook(body): WebhookEvent;
}
```

- **MeliAdapter** e **ShopeeAdapter**: implementação completa no MVP.
- **TikTokShopAdapter**: v1.0 (após aprovação de partner).
- **SheinAdapter**: stub que lança `NotImplementedError` com feature flag desligada — pronto para o dia em que a API oficial existir.

Tudo é normalizado para modelos internos (`NormalizedOrder`, etc.), então o resto do sistema é agnóstico de plataforma.

---

## 3. Fluxos Principais

### 3.1 Conexão de loja (OAuth)
```
Usuário clica "Conectar Mercado Livre"
  → API gera state (assinado) e redireciona p/ adapter.getAuthUrl()
  → Usuário autoriza no ML
  → ML redireciona p/ /oauth/callback?code=...&state=...
  → API valida state → adapter.exchangeCode() → salva TokenSet CRIPTOGRAFADO
  → Enfileira job "initial-import" (produtos + pedidos recentes)
  → UI mostra loja com status "Sincronizando"
```

### 3.2 Sincronização de estoque (feature-âncora, anti-overselling)
```
Gatilho: venda, ajuste manual, ou import
  → Atualiza estoque central (SKU) em transação
  → Enfileira job "propagate-stock" por (SKU × lojas que anunciam o SKU)
  → Worker chama adapter.updateStock() em cada loja, respeitando rate limit
  → Retry com backoff; se falhar, marca listing com status "sync_error" (visível na UI)

Reserva: ao entrar pedido novo, reserva a qtd na hora (stock_reserved) para
não vender o mesmo item em 2 canais antes da propagação terminar.
```

### 3.3 Ingestão de pedidos (webhook + polling de fallback)
```
Preferencial: webhook do marketplace → fila "process-webhook" (idempotente por event_id)
Fallback:     cron a cada N min → adapter.fetchOrders(since=lastSync)
  → Normaliza → upsert em orders/order_items → baixa/reserva estoque
  → Dispara sync de estoque nas demais lojas
```
Webhooks + polling juntos garantem que nada se perca se um webhook falhar.

### 3.4 Etiqueta + NF-e
```
Usuário seleciona pedidos → "Gerar etiquetas"
  → Job chama Melhor Envio (ou etiqueta nativa) → PDF salvo em storage → link na UI
"Emitir NF-e"
  → Job chama Focus NFe com dados do pedido → guarda status/DANFE/XML
  → (NF-e é assíncrona: status pendente → autorizada/erro via callback)
```

---

## 4. Multi-tenancy

- **Estratégia:** tenant_id em todas as tabelas de negócio (row-level isolation), forçado por um Prisma middleware/guard que injeta `tenant_id` do JWT em toda query. Simples, barato, suficiente para a escala-alvo.
- Migração futura para schema-per-tenant só se um cliente grande exigir (improvável no público-alvo).

---

## 5. Segurança

| Item | Decisão |
|---|---|
| Auth de usuário | JWT (access curto ~15min) + refresh token rotativo |
| Tokens de marketplace | Criptografados em repouso (AES-256-GCM, chave em secret manager) |
| OAuth | Escopos mínimos; state assinado (anti-CSRF) |
| RBAC | Papéis: `OWNER`, `STAFF` (permissões por módulo) |
| Webhooks | Verificação de assinatura por plataforma; idempotência por event_id |
| LGPD | PII de comprador isolada; endpoints de export/delete; retenção configurável |

---

## 6. Filas (BullMQ / Redis)

| Fila | Função | Concorrência | Retry |
|---|---|---|---|
| `initial-import` | 1ª carga de produtos/pedidos | baixa | 3× backoff |
| `process-webhook` | eventos de marketplace | média | 5× backoff |
| `propagate-stock` | espalhar estoque entre lojas | por-conta (throttle) | 5× backoff |
| `orders-poll` | polling de fallback (cron) | 1 | — |
| `labels` | etiquetas Melhor Envio | baixa | 3× |
| `nfe` | emissão NF-e | baixa | 3× + polling status |

Throttling **por conta de marketplace** para não estourar rate limit.

---

## 7. Observabilidade (mínima e barata)
- Logs estruturados (pino) com `tenant_id` / `job_id`.
- Health checks (`/health`) e métricas básicas (fila pendente, erros de sync).
- Alertas simples: fila travada, taxa de `sync_error` alta.
- Sentry (free tier) para exceções.

---

## 8. Deploy (barato)
- **App + Workers:** 1 container Node (API) + 1 container worker — Railway / Render / Fly.io.
- **Postgres:** gerenciado (Neon / Supabase / Railway).
- **Redis:** gerenciado (Upstash — cobra por request, ótimo p/ começar barato).
- **Storage:** S3-compatível (Cloudflare R2 — egress grátis) para PDFs/etiquetas/XML.
- **Front:** Vercel (Next.js).
- CI: GitHub Actions (lint + test + migrate + deploy).
