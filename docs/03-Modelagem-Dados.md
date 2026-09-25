# LojaFácil ERP — Modelagem de Dados

> PostgreSQL. Multi-tenant por `tenant_id`. Abaixo: diagrama ER textual, descrição das tabelas e DDL das principais. O esquema Prisma completo está em `backend/prisma/schema.prisma`.

---

## 1. Diagrama ER (textual)

```
tenants ──1:N── users
   │
   ├──1:N── stores ──1:N── listings ──N:1── products(sku)
   │           │
   │           ├──1:N── orders ──1:N── order_items ──N:1── products(sku)
   │           │
   │           └──1:N── messages
   │
   ├──1:N── products ──1:N── stock_movements
   │
   └──1:1── subscriptions ──N:1── plans
```

Regras centrais:
- **Produto/SKU é global do tenant** (uma verdade de estoque).
- **Listing** = a materialização de um produto **numa loja** (tem `external_id`, preço e status próprios por canal).
- **Estoque** vive em `products.stock_available` + reservas; `stock_movements` é o log auditável.

---

## 2. Tabelas Principais

| Tabela | Descrição |
|---|---|
| `tenants` | Conta cliente (o vendedor). Raiz do isolamento. |
| `users` | Usuários do tenant (OWNER/STAFF) com senha hash. |
| `plans` | Catálogo de planos (limites e preço). |
| `subscriptions` | Assinatura ativa do tenant + status de billing. |
| `stores` | Loja conectada (plataforma + credenciais OAuth criptografadas). |
| `products` | SKU global do tenant; fonte da verdade de estoque e custo. |
| `listings` | Anúncio do produto numa loja específica (external_id, preço, status). |
| `orders` | Pedido normalizado vindo de uma loja. |
| `order_items` | Itens do pedido (liga a SKU). |
| `stock_movements` | Log de toda entrada/saída/reserva de estoque. |
| `messages` | Perguntas/mensagens do comprador (ML/Shopee). |
| `sync_logs` | Auditoria de jobs de sincronização e erros. |

---

## 3. DDL (principais)

```sql
-- ---------- TENANT & USERS ----------
CREATE TABLE tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('OWNER', 'STAFF');

CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email        CITEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name         TEXT,
  role         user_role NOT NULL DEFAULT 'OWNER',
  permissions  JSONB NOT NULL DEFAULT '{}',   -- flags por módulo p/ STAFF
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);
CREATE INDEX ON users(tenant_id);

-- ---------- PLANOS & ASSINATURA ----------
CREATE TABLE plans (
  id            TEXT PRIMARY KEY,                 -- 'free' | 'basic' | 'pro'
  name          TEXT NOT NULL,
  max_stores    INT NOT NULL,
  max_orders_mo INT NOT NULL,
  max_skus      INT NOT NULL,
  max_users     INT NOT NULL,
  price_cents   INT NOT NULL DEFAULT 0
);

CREATE TYPE sub_status AS ENUM ('active','past_due','canceled','trialing');

CREATE TABLE subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id     TEXT NOT NULL REFERENCES plans(id),
  status      sub_status NOT NULL DEFAULT 'trialing',
  renews_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- STORES (lojas conectadas) ----------
CREATE TYPE platform AS ENUM ('MELI','SHOPEE','TIKTOK','SHEIN');
CREATE TYPE store_sync_status AS ENUM ('ok','syncing','error','disconnected');

CREATE TABLE stores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform       platform NOT NULL,
  nickname       TEXT NOT NULL,                  -- apelido definido pelo lojista
  external_seller_id TEXT,                        -- id do vendedor na plataforma
  access_token_enc  BYTEA,                        -- criptografado (AES-256-GCM)
  refresh_token_enc BYTEA,
  token_expires_at  TIMESTAMPTZ,
  sync_status    store_sync_status NOT NULL DEFAULT 'syncing',
  last_synced_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, platform, external_seller_id)
);
CREATE INDEX ON stores(tenant_id);

-- ---------- PRODUCTS / SKU (verdade de estoque) ----------
CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku              TEXT NOT NULL,
  title            TEXT NOT NULL,
  cost_cents       INT NOT NULL DEFAULT 0,       -- custo p/ relatório de lucro
  stock_available  INT NOT NULL DEFAULT 0,       -- disponível p/ venda
  stock_reserved   INT NOT NULL DEFAULT 0,       -- reservado por pedidos abertos
  low_stock_threshold INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);
CREATE INDEX ON products(tenant_id);

-- ---------- LISTINGS (anúncio por loja) ----------
CREATE TYPE listing_status AS ENUM ('active','paused','closed','sync_error');

CREATE TABLE listings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  external_id  TEXT,                             -- id do anúncio na plataforma
  price_cents  INT NOT NULL,
  status       listing_status NOT NULL DEFAULT 'active',
  last_sync_error TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, external_id)
);
CREATE INDEX ON listings(tenant_id);
CREATE INDEX ON listings(product_id);

-- ---------- ORDERS ----------
CREATE TYPE order_status AS ENUM
  ('pending','paid','ready_to_ship','shipped','delivered','canceled');

CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id       UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  external_id    TEXT NOT NULL,                  -- id do pedido na plataforma
  status         order_status NOT NULL,
  total_cents    INT NOT NULL,
  platform_fee_cents INT NOT NULL DEFAULT 0,     -- taxa da plataforma (p/ lucro)
  buyer_name     TEXT,
  shipping_json  JSONB,                          -- endereço/frete normalizado
  tracking_code  TEXT,
  nfe_status     TEXT,                           -- null|pending|authorized|error
  nfe_key        TEXT,
  placed_at      TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, external_id)
);
CREATE INDEX ON orders(tenant_id, placed_at DESC);
CREATE INDEX ON orders(tenant_id, status);

CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id),     -- pode ser null se SKU não mapeado
  sku          TEXT,
  title        TEXT NOT NULL,
  qty          INT NOT NULL,
  unit_price_cents INT NOT NULL
);
CREATE INDEX ON order_items(order_id);

-- ---------- STOCK MOVEMENTS (auditoria) ----------
CREATE TYPE movement_type AS ENUM
  ('inbound','outbound','reserve','release','adjust');

CREATE TABLE stock_movements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type         movement_type NOT NULL,
  qty          INT NOT NULL,                     -- + ou - conforme o tipo
  reason       TEXT,                             -- 'order', 'manual', 'import'...
  order_id     UUID REFERENCES orders(id),
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON stock_movements(tenant_id, product_id, created_at DESC);

-- ---------- MESSAGES (atendimento) ----------
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  external_thread_id TEXT NOT NULL,
  buyer_name   TEXT,
  body         TEXT NOT NULL,
  direction    TEXT NOT NULL,                    -- 'in' | 'out'
  answered     BOOLEAN NOT NULL DEFAULT false,
  received_at  TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON messages(tenant_id, answered, received_at DESC);

-- ---------- SYNC LOGS ----------
CREATE TABLE sync_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id   UUID REFERENCES stores(id) ON DELETE CASCADE,
  job        TEXT NOT NULL,                      -- 'propagate-stock' etc.
  status     TEXT NOT NULL,                      -- 'ok' | 'error'
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON sync_logs(tenant_id, created_at DESC);
```

---

## 4. Notas de Modelagem
- **Estoque:** `stock_available` é a verdade; ao entrar pedido, faz-se `reserve` (move p/ `stock_reserved`); ao enviar, `outbound` baixa definitivo. Todo movimento gera `stock_movements` (auditoria).
- **Anti-overselling:** o disponível efetivo é `stock_available − stock_reserved`; a propagação para as lojas usa esse valor.
- **SKU não mapeado:** `order_items.product_id` pode ser nulo (pedido de um anúncio ainda não vinculado a um SKU) — a UI destaca para o lojista vincular.
- **Valores monetários em centavos (INT)** para evitar erro de ponto flutuante.
- **Tokens** nunca em texto claro: colunas `*_enc` (BYTEA) com AES-256-GCM.
