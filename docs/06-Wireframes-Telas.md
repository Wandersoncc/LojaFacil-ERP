# LojaFácil ERP — Wireframes / Descrição das Telas

> Princípio de UI: **interface extremamente limpa**. Poucos elementos por tela, ação primária óbvia, linguagem do lojista (não jargão técnico). Layouts em ASCII a seguir são baixa fidelidade — servem de guia para o design final.

---

## 0. Navegação global

**Web (desktop):** sidebar fixa à esquerda + topbar com seletor de loja e usuário.
**Mobile (PWA):** bottom tab bar com 4 ícones: **Pedidos · Estoque · Anúncios · Mais**.

Itens de menu: `Dashboard · Pedidos · Produtos/Estoque · Anúncios · Mensagens · Lojas · Relatórios · Config`.

---

## 1. Login / Cadastro
```
┌───────────────────────────────┐
│        LojaFácil ERP           │
│                                │
│  Email    [______________]     │
│  Senha    [______________]     │
│           [  Entrar  ]         │
│                                │
│  Não tem conta? Criar conta    │
└───────────────────────────────┘
```
Simples. Sem distração. Após login, se não há loja conectada → vai direto para "Conectar loja".

---

## 2. Dashboard
```
┌──────────────────────────────────────────────────────────┐
│ Olá, Márcia 👋                    [Todas as lojas ▾]       │
├───────────────┬───────────────┬──────────────────────────┤
│ Vendas hoje   │ Vendas 7 dias │ Vendas 30 dias           │
│  R$ 1.240     │  R$ 8.900     │  R$ 34.200               │
├───────────────┴───────────────┴──────────────────────────┤
│ Pedidos por status                                        │
│  [A pagar 3] [A enviar 12] [Enviados 40] [Cancelados 2]   │
├───────────────────────────────────────────────────────────┤
│ ⚠ 4 produtos com estoque baixo        [Ver]               │
│ ⚠ 2 anúncios com erro de sincronização [Resolver]         │
├───────────────────────────────────────────────────────────┤
│ Mais vendidos (30d)                                        │
│  1. Camiseta Preta P   32 un                              │
│  2. Caneca Branca      21 un                              │
└───────────────────────────────────────────────────────────┘
```
Foco: o que precisa de ação hoje (a enviar, estoque baixo, erro de sync) aparece em destaque.

---

## 3. Pedidos (lista unificada) — tela mais usada
```
┌──────────────────────────────────────────────────────────────┐
│ Pedidos          [Loja ▾][Plataforma ▾][Status ▾][Data ▾][🔍] │
├──────────────────────────────────────────────────────────────┤
│ ☐  #ML-9921  Mercado Livre  A enviar   R$ 89,90  João S.      │
│ ☐  #SP-4410  Shopee         A enviar   R$ 45,00  Ana P.       │
│ ☐  #ML-9930  Mercado Livre  Pago       R$ 120,00 Bruno L.     │
├──────────────────────────────────────────────────────────────┤
│ [☐ Selecionar todos]   Selecionados: 2                        │
│ [ Marcar enviado ] [ Gerar etiquetas ] [ Emitir NF-e ]        │
└──────────────────────────────────────────────────────────────┘
```
Ações em lote na barra inferior. Badge de plataforma colorido para leitura rápida. Clicar no pedido abre o detalhe (itens, comprador, frete, rastreio, NF-e).

**Detalhe do pedido:** itens + SKU, endereço, status de envio, botão etiqueta, status NF-e, e aviso se algum item não está vinculado a um SKU.

---

## 4. Produtos / Estoque
```
┌──────────────────────────────────────────────────────────────┐
│ Produtos / Estoque     [+ Novo produto] [Importar planilha]   │
│                        [🔍 buscar SKU/título]                 │
├──────────────────────────────────────────────────────────────┤
│ SKU        Título            Disp.  Reserv.  Custo   Anúncios  │
│ CAM-PT-P   Camiseta Preta P   45      3      R$12    ML,Shopee │
│ CAN-BR     Caneca Branca       8 ⚠    0      R$ 6    Shopee    │
├──────────────────────────────────────────────────────────────┤
│ [ Edição em massa: preço | estoque | status ]                 │
└──────────────────────────────────────────────────────────────┘
```
`⚠` sinaliza estoque abaixo do limite. Coluna "Anúncios" mostra em quais lojas o SKU está publicado (a base do anti-overselling).

**Ajuste de estoque (modal):** entrada/saída manual com motivo → grava `stock_movement` e dispara sync.

---

## 5. Anúncios
```
┌──────────────────────────────────────────────────────────────┐
│ Anúncios           [Loja ▾][Status ▾]                         │
├──────────────────────────────────────────────────────────────┤
│ Anúncio           Loja        Preço    Status                 │
│ Camiseta Preta P  ML Conta 1  R$ 39,90 ● Ativo                │
│ Camiseta Preta P  Shopee      R$ 42,00 ● Ativo                │
│ Caneca Branca     Shopee      R$ 24,90 ⚠ Erro sync            │
├──────────────────────────────────────────────────────────────┤
│ Ações: [ Duplicar ] [ Migrar p/ outra conta ML ] [ Pausar ]   │
└──────────────────────────────────────────────────────────────┘
```
"Migrar" só entre contas da **mesma plataforma** (requisito). Erro de sync tem botão "Tentar de novo".

---

## 6. Mensagens (atendimento)
```
┌──────────────────────────────┬───────────────────────────────┐
│ Conversas (não resp.) [ML][SP]│  João S. — Mercado Livre       │
│ ● João S.  "Tem na cor azul?" │  ─────────────────────────────│
│   Ana P.   "Chega quando?"    │  João: Tem na cor azul?        │
│                               │                                │
│                               │  [ Digite a resposta...     ]  │
│                               │  [        Responder         ]  │
└──────────────────────────────┴───────────────────────────────┘
```
Inbox unificada ML + Shopee. Resposta manual. Sem automação.

---

## 7. Lojas
```
┌──────────────────────────────────────────────────────────────┐
│ Minhas lojas (3/5)              [+ Conectar loja]             │
├──────────────────────────────────────────────────────────────┤
│ 🟢 ML Conta 1     Mercado Livre   Sincronizado há 2 min       │
│ 🟢 Loja Shopee    Shopee          Sincronizado há 5 min       │
│ 🔴 ML Conta 2     Mercado Livre   Reautenticar  [Conectar]    │
├──────────────────────────────────────────────────────────────┤
│ Conectar: [Mercado Livre] [Shopee] [TikTok (em breve)]        │
│           [Shein (em breve)]                                  │
└──────────────────────────────────────────────────────────────┘
```
Status por cor. TikTok/Shein aparecem como "em breve" (desabilitados) — honesto quanto à disponibilidade.

---

## 8. Relatórios
```
┌──────────────────────────────────────────────────────────────┐
│ Relatórios      [Período ▾][Loja ▾]         [ Exportar CSV ]  │
├──────────────────────────────────────────────────────────────┤
│ Receita          R$ 34.200                                    │
│ (-) Custo produto R$ 12.100                                   │
│ (-) Taxas plataf. R$  4.800                                   │
│ = Lucro estimado  R$ 17.300                                   │
├──────────────────────────────────────────────────────────────┤
│ Por plataforma:  ML R$ 21.000 · Shopee R$ 13.200             │
└──────────────────────────────────────────────────────────────┘
```
Lucro **estimado** (não contábil): receita − custo do SKU − taxas. Deixar claro que é aproximado.

---

## 9. Configurações
- **Conta/Perfil**, **Usuários** (convidar STAFF + permissões por módulo), **Plano/Assinatura** (uso vs. limites, upgrade), **Integrações** (Focus NFe, Melhor Envio), **Preferências** (limite de estoque baixo padrão).

---

## 10. PWA Mobile — telas essenciais
Bottom tabs: **Pedidos · Estoque · Anúncios · Mais**.
- **Pedidos:** lista enxuta; toque no pedido → marcar enviado / ver etiqueta.
- **Estoque:** buscar SKU → ajustar quantidade rápido.
- **Mensagens** (em "Mais"): responder pergunta.
- Instalável (add to home screen), funciona bem em 4G, telas de carregamento leves.

---

## Diretrizes visuais
- Paleta clara, 1 cor primária de ação, muito espaço em branco.
- Badges de plataforma com cor fixa (ML amarelo, Shopee laranja) para leitura instantânea.
- Toda tela tem **1 ação primária** clara.
- Mensagens de erro em português simples com o próximo passo ("Reconecte sua loja", não "401 Unauthorized").
