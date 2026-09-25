# LojaFácil ERP — Plano de Desenvolvimento em Fases

> Meta: algo **realmente usável por um pequeno vendedor em 30–60 dias**. Equipe de referência: **2 devs full-stack + 1 dev part-time/designer**. Ajuste os prazos conforme o tamanho real do time.

---

## Fase 0 — Fundação (Semana 1) · ~5 dias

Antes de qualquer feature de negócio.

- Setup do monorepo (backend NestJS + frontend Next.js)
- Postgres + Prisma + migrations iniciais (esquema do doc 03)
- Redis + BullMQ configurados
- Auth base (JWT + refresh, guard multi-tenant)
- CI/CD (GitHub Actions) + deploy de staging
- Criptografia de tokens (AES-256-GCM) + secret manager

**Critério de aceite:** login funciona, migrations rodam, um job de fila "hello" executa em staging.

---

## Fase 1 — MVP (Semanas 2–6) · ~25 dias úteis

> **Objetivo do MVP:** o lojista conecta ML + Shopee, vê pedidos unificados, cadastra produtos e o estoque sincroniza entre lojas (anti-overselling). É a menor versão que já entrega valor real.

| # | Entrega | Depende de |
|---|---|---|
| 1 | **Gestão de lojas + OAuth ML** | Fase 0 |
| 2 | **OAuth Shopee** | #1 |
| 3 | **Cadastro manual de produtos/SKU** | Fase 0 |
| 4 | **Estoque centralizado + movimentações manuais** | #3 |
| 5 | **Ingestão de pedidos (ML + Shopee)** — webhook + polling | #1, #2 |
| 6 | **Listagem unificada de pedidos + filtros** | #5 |
| 7 | **Sincronização de estoque entre lojas (âncora)** | #4, #5 |
| 8 | **Dashboard mínimo** (vendas 7/30d, pedidos por status) | #6 |

**Critérios de aceite do MVP:**
- ✅ Conectar 1 conta ML e 1 Shopee sem erro.
- ✅ Pedidos das duas aparecem na lista unificada em < 5 min.
- ✅ Vender um SKU numa loja reduz o estoque na outra automaticamente (sem overselling em teste).
- ✅ Cadastrar produto e ver estoque atualizar após pedido.
- ✅ PWA responsivo abre e mostra pedidos no celular.

---

## Fase 2 — v1.0 (Semanas 7–11) · ~25 dias úteis

> Transforma o MVP em produto vendável (fatura, expede, atende).

| # | Entrega |
|---|---|
| 1 | **Processamento em lote** (marcar enviado, ações em massa) |
| 2 | **Etiquetas via Melhor Envio** + etiqueta nativa |
| 3 | **NF-e via Focus NFe** (emissão assíncrona + status) |
| 4 | **Alerta de estoque baixo** |
| 5 | **Edição em massa de anúncios** (preço/estoque/status) |
| 6 | **Duplicar anúncio + migração entre contas da mesma plataforma** |
| 7 | **Importação por planilha (CSV/XLSX)** |
| 8 | **Atendimento unificado** (mensagens ML + Shopee, resposta manual) |
| 9 | **RBAC** (dono + funcionários) |
| 10 | **Planos + billing** (Gratuito/Básico/Pro) |
| 11 | **Relatório de lucro básico** + export CSV |

**Critérios de aceite v1.0:** lojista consegue rodar a operação inteira (pedido → etiqueta → NF-e → envio) e pagar a assinatura.

---

## Fase 3 — Melhorias e novos canais (Semana 12+)

| Prioridade | Item | Observação |
|---|---|---|
| Alta | **Integração TikTok Shop** | Depende de aprovação no Partner Center (escopo/categoria) — iniciar onboarding cedo |
| Média | **Canais fase 2**: Magalu, Amazon, Nuvemshop | Cada um = 1 novo adapter |
| Média | Sugestão simples de título (texto, sem IA pesada) | Campo de apoio |
| Baixa | **Shein** | ⚠️ **Condicional** — só quando existir Open Platform de seller oficial. Hoje só o adapter stub |
| Baixa | Relatórios um pouco mais ricos, notificações push no PWA | Sem virar enterprise |

---

## Linha do tempo resumida

```
Sem 1     Sem 2 ─────────── 6         Sem 7 ─────────── 11        Sem 12+
[Fase 0]  [ ===== MVP ===== ]         [ ===== v1.0 ===== ]        [ Melhorias ]
Fundação   ML+Shopee, pedidos,         Etiqueta, NF-e, atend.,    TikTok, +canais,
           estoque sync, produtos      billing, RBAC, planilha    Shein (condicional)
```

**Total até v1.0 vendável: ~11 semanas (~55 dias úteis).** O MVP demonstrável sai por volta da **semana 6**, dentro da janela de 30–60 dias.

---

## Estratégia de entrega
- **Vertical slices**: cada entrega vai de ponta a ponta (API → UI), não camada por camada.
- **Feature flags** por canal e por módulo, para ligar/desligar sem deploy grande.
- **Adapter Shein/TikTok atrás de flag** desde o início.
- Beta fechado com 3–5 lojistas reais ao fim do MVP para validar antes da v1.0.
