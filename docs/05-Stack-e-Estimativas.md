# LojaFácil ERP — Stack Completa & Estimativa de Esforço

---

## 1. Stack Recomendada (e por quê)

| Camada | Escolha | Justificativa (foco: leve, barato, estável) |
|---|---|---|
| **Backend** | **NestJS (Node 20 + TypeScript)** | Modular por design (encaixa no padrão de módulos/adapters), 1 linguagem no full-stack, ecossistema forte para filas e OAuth |
| **Frontend** | **Next.js 14 (App Router) + React + TypeScript** | SSR/SEO para landing, mesmo código serve o **PWA mobile** responsivo; Vercel deploy barato |
| **UI kit** | **Tailwind CSS + shadcn/ui** | Interface limpa e consistente rápido; leve, sem framework pesado |
| **Banco** | **PostgreSQL 16** | Relacional robusto, JSONB para payloads de marketplace, transações p/ estoque |
| **ORM** | **Prisma** | Migrations simples, type-safe, produtivo; middleware para multi-tenant |
| **Filas** | **BullMQ + Redis** | Padrão do ecossistema Node; retry/backoff/throttle nativos |
| **Cache/Sessão** | **Redis** | Reuso do mesmo Redis das filas |
| **Auth** | **JWT (access+refresh)** + **OAuth 2.0** dos marketplaces | Padrão, sem dependência de terceiro caro |
| **Storage** | **Cloudflare R2** (S3-compat) | Etiquetas/DANFE/XML; egress grátis = barato |
| **NF-e** | **Focus NFe** (padrão) / eNotas (alt.) | Terceiriza complexidade fiscal/SEFAZ; barato p/ volume pequeno |
| **Frete/Etiqueta** | **Melhor Envio** | Cobre Correios/transportadoras numa API só |
| **Erros/Logs** | **Sentry (free)** + **pino** | Observabilidade barata |
| **Deploy** | **Railway/Render/Fly.io** (API+worker) + **Vercel** (front) | PaaS baratos, sem time de infra |
| **CI/CD** | **GitHub Actions** | Grátis para o volume, integra com deploy |
| **Testes** | **Jest/Vitest** (unit) + **Supertest** (e2e) + **Playwright** (crítico) | Testes básicos, foco em estoque/pedidos/OAuth |

> **Alternativas válidas:** se o time dominar **Laravel** ou **FastAPI**, ambos atendem — a arquitetura de adapters/filas é a mesma. NestJS foi escolhido por unificar a linguagem com o front e reduzir custo cognitivo.

---

## 2. Estimativa de Esforço por Módulo

Unidade: **dia útil de 1 dev** (dev-day). Inclui código, testes básicos e revisão. Não inclui reuniões/imprevistos (aplicar buffer ~20%).

### Fase 0 — Fundação
| Item | Dev-days |
|---|---|
| Monorepo + tooling + CI/CD | 2 |
| Prisma + schema + migrations | 1,5 |
| Auth base (JWT+refresh) + guard multi-tenant | 2 |
| Setup Redis/BullMQ + cripto de tokens | 1,5 |
| **Subtotal** | **~7** |

### Fase 1 — MVP
| Módulo | Dev-days |
|---|---|
| Gestão de lojas (UI + modelo) | 2 |
| **Adapter + OAuth Mercado Livre** | 5 |
| **Adapter + OAuth Shopee** | 5 |
| Produtos/SKU (CRUD + UI) | 3 |
| Estoque central + movimentações | 3 |
| Ingestão de pedidos (webhook + polling) | 4 |
| Listagem unificada + filtros (UI) | 3 |
| **Sync de estoque entre lojas (âncora)** | 4 |
| Dashboard mínimo | 2 |
| PWA/responsivo básico | 2 |
| Hardening + testes de integração | 3 |
| **Subtotal MVP** | **~36** |

### Fase 2 — v1.0
| Módulo | Dev-days |
|---|---|
| Processamento em lote de pedidos | 2 |
| Etiquetas (Melhor Envio) | 4 |
| NF-e (Focus NFe, assíncrono) | 5 |
| Alerta de estoque baixo | 1 |
| Edição em massa de anúncios | 3 |
| Duplicar + migrar anúncio (mesma plataforma) | 3 |
| Importação por planilha CSV/XLSX | 3 |
| Atendimento unificado (mensagens) | 4 |
| RBAC (dono + funcionários) | 3 |
| Planos + billing | 4 |
| Relatório de lucro + export CSV | 3 |
| Hardening + testes | 3 |
| **Subtotal v1.0** | **~38** |

### Fase 3 — Melhorias/Canais (referência)
| Item | Dev-days |
|---|---|
| Adapter TikTok Shop (+ onboarding partner à parte) | 6 |
| Cada canal adicional (Magalu/Amazon/Nuvemshop) | 5 cada |
| Sugestão simples de título | 2 |
| Adapter Shein (stub → real quando abrir) | 1 (stub) / 5 (real) |

---

## 3. Resumo de Esforço

| Fase | Dev-days | Com 2 devs (~) | Com buffer 20% |
|---|---|---|---|
| Fundação | 7 | ~1 semana | — |
| **MVP** | 36 | ~4 semanas | ~4,5 sem |
| **v1.0** | 38 | ~4 semanas | ~5 sem |
| **Total até v1.0** | **~81 dev-days** | **~9–11 semanas** | dentro do alvo |

> Com **2 devs full-stack**, o **MVP demonstrável** cai por volta da **semana 5–6** e a **v1.0 vendável** por volta da **semana 10–11** — coerente com a meta de 30–60 dias para o MVP.

---

## 4. Custo Operacional Estimado (infra inicial)

| Serviço | Faixa mensal |
|---|---|
| PaaS API+worker (Railway/Render/Fly) | US$ 10–40 |
| Postgres gerenciado (Neon/Supabase) | US$ 0–25 |
| Redis (Upstash pay-per-use) | US$ 0–15 |
| Storage R2 | US$ 0–5 |
| Vercel (front) | US$ 0–20 |
| Sentry / logs | US$ 0 (free) |
| **Total** | **~US$ 20–100/mês** no início |

Custos variáveis por uso: NF-e (por nota) e Melhor Envio (repassados ao lojista). Mantém o preço de assinatura baixo, como exige o público-alvo.
