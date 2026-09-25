# LojaFácil ERP — Documento de Requisitos de Produto (PRD)

> **Versão:** 1.0 · **Status:** Draft para aprovação · **Escopo:** MVP → v1.0

---

## 1. Visão do Produto

**LojaFácil ERP** é um ERP multicanal **enxuto, barato e simples** para o pequeno vendedor brasileiro que opera de 1 a 5 lojas em marketplaces. Ele resolve os 3 problemas que mais tiram o sono do lojista pequeno — **estoque, pedidos e anúncios** — sem o peso, o custo e a complexidade das ferramentas enterprise.

> **Frase-guia de produto:** *"Se o vendedor precisa de treinamento pra usar, a gente errou."*

### 1.1 Princípios de produto (o que nos mantém leves)
1. **Menos é mais.** Cada feature nova precisa justificar seu custo de manutenção. Na dúvida, não implementa.
2. **Estabilidade > novidade.** Sincronização confiável de estoque vale mais que 10 relatórios bonitos.
3. **Custo operacional baixo.** A arquitetura precisa rodar barato para permitir preço baixo.
4. **Onboarding em minutos.** Conectar a primeira loja e ver pedidos no mesmo dia.
5. **Mobile-first no operacional.** O lojista pequeno vive no celular.

---

## 2. Público-Alvo

| Atributo | Perfil |
|---|---|
| Tamanho da operação | 1 a 5 lojas / marketplaces |
| Equipe | 1 a 5 pessoas (dono + 0–2 auxiliares) |
| Faturamento mensal | Geralmente < R$ 100–200 mil |
| Canais primários | Mercado Livre, Shopee, TikTok Shop, Shein |
| Canais secundários (fase 2) | Magalu, Amazon, Nuvemshop, Shopify |
| Perfil técnico | **Baixo.** Não sabe (nem quer saber) o que é API ou webhook |
| Dor principal | Overselling, retrabalho manual, falta de visão unificada |

### 2.1 Personas

- **Márcia, a revendedora (persona primária).** Vende moda e acessórios no ML e Shopee. Controla estoque numa planilha e já vendeu produto que não tinha. Quer parar de tomar reclamação por atraso/cancelamento.
- **Rafael, o crescendo (persona secundária).** Saiu de 1 para 3 lojas, contratou 1 auxiliar. Precisa dar acesso limitado ao funcionário e ter uma visão de lucro real (depois das taxas).

---

## 3. Análise de Viabilidade das Integrações ⚠️ (leia antes de tudo)

Esta seção é decisão de escopo, não detalhe técnico. Ela ajusta a prioridade pedida à **realidade das APIs oficiais** — respeitando o requisito de "sem scraping agressivo".

| Plataforma | API oficial p/ integrador pequeno? | Decisão no roadmap |
|---|---|---|
| **Mercado Livre** | ✅ Sim — API pública madura, OAuth 2.0, webhooks | **MVP** (prioridade máxima) |
| **Shopee** | ✅ Sim — Open Platform, OAuth, webhooks (push) | **MVP** |
| **TikTok Shop** | ⚠️ Sim, mas via **Partner Center com aprovação de escopo e revisão de categoria** | **Fase 2 (v1.0)** — depende do onboarding de partner |
| **Shein** | ❌ **Não há Open Platform de seller pública** para integradores. O que existe no mercado é acesso por terceiros/scraping ou EDI enterprise | **Fase 3 / condicional** — apenas *adapter stub*; só integra de verdade se/quando a SHEIN abrir API oficial de seller |

> **Nota honesta para o cliente:** prometer Shein "no MVP" via API oficial não é factível hoje e criaria uma feature que quebraria em produção. Mantemos o Shein como **adapter preparado** (interface pronta) para plugar rápido quando abrir. Isso preserva o requisito de simplicidade e estabilidade.

---

## 4. Escopo — Dentro vs. Fora

### 4.1 DENTRO do escopo

#### Módulo 1 — Gestão de Contas / Lojas
- Conectar até 5 lojas (limite configurável por plano)
- OAuth com Mercado Livre e Shopee (MVP); TikTok Shop (v1.0)
- Visão unificada das lojas conectadas + status de sincronização simples (OK / Sincronizando / Erro)
- Reautenticação guiada quando o token expira

#### Módulo 2 — Produtos / Anúncios (simplificado)
- Cadastro manual de produtos e SKUs
- Edição em massa básica: preço, estoque, status (ativo/pausado)
- Duplicar anúncio existente
- Migração simples de anúncio entre contas da **mesma plataforma** (ex.: conta ML → outra conta ML)
- Importação via planilha CSV/XLSX básica (mapeamento de colunas)
- Campo simples de "sugestão de título" (texto, **sem IA avançada**)

#### Módulo 3 — Pedidos
- Lista unificada de pedidos (todas as lojas)
- Filtros: plataforma, status, data, loja
- Processamento em lote simples: marcar como enviado, imprimir etiquetas
- Impressão de etiquetas: **Melhor Envio** (prioritário) + etiqueta nativa do marketplace
- Emissão de NF-e via provedor (**Focus NFe** como padrão; eNotas como alternativa)

#### Módulo 4 — Estoque
- Estoque centralizado por SKU
- **Sincronização de estoque entre lojas para evitar overselling** (feature-âncora)
- Alerta de estoque baixo
- Entrada/saída manual de estoque com histórico de movimentação

#### Módulo 5 — Financeiro e Relatórios (básico)
- Dashboard: vendas de hoje / 7 / 30 dias, pedidos por status, produtos mais vendidos
- Relatório básico de lucro: `receita − custo do produto − taxas da plataforma`
- Exportação CSV

#### Módulo 6 — Atendimento (mínimo viável)
- Tela unificada de perguntas/mensagens (ML e Shopee)
- Resposta manual
- **Sem** chatbot / resposta automática

#### Módulo 7 — Plataforma
- PWA mobile responsivo: ver pedidos, atualizar status, ver estoque, responder mensagens
- Usuários: dono + 1–2 funcionários com permissões básicas (RBAC simples)
- Planos: **Gratuito (limitado)**, **Básico**, **Pro**

### 4.2 FORA do escopo (o que nos mantém mais leves que o UpSeller)
- ❌ IA avançada de geração de conteúdo
- ❌ Coleta/scraping de produtos de concorrentes
- ❌ Gestão de compras e fornecedores
- ❌ Integração com 3PLs complexos
- ❌ Multi-armazém avançado; gestão detalhada de Full/FBS; lotes/serial
- ❌ Marketing automation (flash sales, promoções automáticas)
- ❌ App nativo com scanner sofisticado / wave picking
- ❌ Dezenas de plataformas e centenas de lojas
- ❌ Relatórios avançados (coorte, lucro detalhado por SKU com rateio de custo fixo)

---

## 5. Requisitos Funcionais (resumo por prioridade)

| ID | Requisito | Módulo | Prioridade |
|---|---|---|---|
| RF-01 | Cadastro/login de usuário (email+senha, JWT) | Plataforma | MVP |
| RF-02 | Conectar loja ML via OAuth | Contas | MVP |
| RF-03 | Conectar loja Shopee via OAuth | Contas | MVP |
| RF-04 | Importar pedidos das lojas conectadas | Pedidos | MVP |
| RF-05 | Listar pedidos unificados com filtros | Pedidos | MVP |
| RF-06 | Cadastro manual de produto/SKU | Produtos | MVP |
| RF-07 | Estoque centralizado por SKU | Estoque | MVP |
| RF-08 | Sincronizar estoque entre lojas (anti-overselling) | Estoque | MVP |
| RF-09 | Alerta de estoque baixo | Estoque | v1.0 |
| RF-10 | Marcar pedido como enviado (em lote) | Pedidos | v1.0 |
| RF-11 | Imprimir etiqueta (Melhor Envio) | Pedidos | v1.0 |
| RF-12 | Emitir NF-e (Focus NFe) | Pedidos | v1.0 |
| RF-13 | Dashboard financeiro básico | Relatórios | v1.0 |
| RF-14 | Tela de mensagens ML/Shopee | Atendimento | v1.0 |
| RF-15 | Importação por planilha | Produtos | v1.0 |
| RF-16 | RBAC (dono + funcionários) | Plataforma | v1.0 |
| RF-17 | Planos e billing | Plataforma | v1.0 |
| RF-18 | Integração TikTok Shop | Contas | Fase 2 |
| RF-19 | Adapter Shein (stub) | Contas | Fase 3 / condicional |

---

## 6. Requisitos Não-Funcionais

| Categoria | Requisito |
|---|---|
| **Performance** | Listagem de pedidos < 800 ms para até 10k pedidos; dashboard < 1,5 s |
| **Escalabilidade** | Multi-tenant desde o dia 1; alvo inicial de centenas de tenants em 1 nó + workers |
| **Confiabilidade** | Sync de estoque com fila + retry/backoff; idempotência em webhooks |
| **Anti-overselling** | Reserva de estoque ao criar pedido; propagação de estoque em ≤ 60 s |
| **Segurança** | Tokens de marketplace criptografados em repouso (AES-256); JWT curto + refresh; escopo mínimo de OAuth |
| **Rate limits** | Respeitar limites de cada API (fila + throttling por conta) |
| **LGPD** | Dados de cliente final tratados como PII; política de retenção; export/delete |
| **Custo** | Rodar MVP em infra < US$ 100/mês (1 app node + Postgres gerenciado + Redis) |
| **Disponibilidade** | 99% no MVP; degradação graciosa se um marketplace estiver fora |
| **i18n** | pt-BR no MVP; estrutura pronta para es-LATAM |

---

## 7. Planos de Assinatura

| Recurso | Gratuito | Básico | Pro |
|---|---|---|---|
| Lojas conectadas | 1 | 3 | 5 |
| Pedidos/mês | 100 | 1.000 | 5.000 |
| SKUs | 50 | 1.000 | ilimitado* |
| Sync de estoque | ✅ | ✅ | ✅ |
| Usuários | 1 | 2 | 5 |
| Etiquetas + NF-e | ❌ | ✅ | ✅ |
| Relatório de lucro | ❌ | básico | básico+ |
| Atendimento unificado | ❌ | ✅ | ✅ |
| Preço-alvo (referência) | R$ 0 | ~R$ 49/mês | ~R$ 99/mês |

\* "ilimitado" com fair-use. Preços são hipóteses de posicionamento a validar com pesquisa de mercado.

---

## 8. Métricas de Sucesso (North Star)
- **NSM:** nº de pedidos processados via LojaFácil por semana.
- **Ativação:** % de contas que conectam ≥ 1 loja e veem pedidos em 24 h (meta > 60%).
- **Retenção:** churn mensal < 5% no plano pago.
- **Confiabilidade âncora:** incidentes de overselling atribuíveis ao sistema = 0.

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Mudança/depreciação de API de marketplace | Alto | Padrão *adapter* isolado por plataforma; testes de contrato |
| Rate limit / bloqueio | Médio | Fila + throttling por conta; backoff exponencial |
| Shein/TikTok sem acesso liberado | Médio | Escopo já trata como fase 2/3 condicional (ver §3) |
| Overselling por atraso de sync | Alto | Reserva de estoque + webhooks + polling de fallback |
| Complexidade fiscal (NF-e) | Médio | Terceirizar via provedor (Focus NFe), não reimplementar SEFAZ |
