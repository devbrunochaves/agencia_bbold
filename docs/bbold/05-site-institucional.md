# 05 — Site Institucional

## 5.1 Páginas Públicas

| URL | Arquivo | Tipo | Renderização |
|-----|---------|------|--------------|
| `/` | `app/(main)/page.tsx` | Homepage | Server Component (filhos mistos) |
| `/blog` | `app/(main)/blog/page.tsx` | Listagem de posts | Server Component + ISR 60s |
| `/blog/[slug]` | `app/(main)/blog/[slug]/page.tsx` | Post individual | Server Component + ISR 60s |
| `/projetos` | `app/(main)/projetos/page.tsx` | Portfólio completo | Server Component |
| `/projetos/[slug]` | `app/(main)/projetos/[slug]/page.tsx` | Detalhe do case | Server Component |
| `/presenca-digital` | `app/(main)/presenca-digital/page.tsx` | Landing page | Server Component (metadata) + Client Component |
| `/diagnostico` | `app/diagnostico/page.jsx` | Quiz público | Client Component |
| `/bio` | `app/bio/page.tsx` | Link-in-bio | Server Component (CSS inline) |

Todas as rotas sob `(main)` herdam o layout `app/(main)/layout.tsx`, que injeta automaticamente `<Nav>` e `<Footer>`.

---

## 5.2 Navegação (`components/Nav.tsx`)

**Tipo:** Client Component (precisa de estado de scroll e menu mobile).

### Links do menu desktop

| Label | Destino |
|-------|---------|
| Serviços | `/#servicos` (âncora) |
| Método | `/#metodo` (âncora) |
| Projetos | `/projetos` (rota) |
| Blog | `/blog` (rota) |
| Quem Somos | `/#quem-somos` (âncora) |
| Fale Conosco | `/#contato` (âncora, botão amarelo) |

### Comportamento

- Ao scrollar mais de 40px: adiciona fundo `bg-black/95` com `backdrop-blur-md` e borda amarela inferior.
- Menu hamburger para mobile: tela cheia com os mesmos links.
- Sem barra de busca, breadcrumb ou submenu.

**Evidência:** `components/Nav.tsx`

---

## 5.3 Rodapé (`components/Footer.tsx`)

**Tipo:** Server Component.

Grid 3 colunas:

| Coluna | Conteúdo |
|--------|---------|
| Marca | Logo SVG + tagline "Posicionamento digital para empresas. Serra, Espírito Santo — Brasil." |
| Serviços | Links internos para `/#servicos` (Social Media, Tráfego Pago, Design Gráfico, Sites & Landing Pages, Google Meu Negócio) |
| Redes Sociais | Botões para Instagram, LinkedIn, WhatsApp, Blog |

Links externos: `instagram.com/agenciabbold`, `linkedin.com/company/agenciabbold`, `wa.me/5527997341557`.

Rodapé inferior: "© 2026 Agência BBold. Todos os direitos reservados."

---

## 5.4 Homepage — Seções

A homepage (`app/(main)/page.tsx`) é composta por componentes independentes importados em sequência:

```
RevealInit → Hero → Numbers → Services → MetodoBBold → HowWeWork
→ CustomProjects → ProjectsPreview → About → CtaBand → Contact
```

`BlogPreview` está importado no código mas a seção só aparece se houver posts no Sanity (retorna `null` caso contrário).

---

### 5.4.1 RevealInit

Inicializa o IntersectionObserver que monitora elementos `.reveal` e adiciona a classe `.visible` ao entrarem na viewport. Sem esse componente, as animações de scroll não funcionam.

**Arquivo:** `components/RevealInit.tsx`

---

### 5.4.2 Hero

**Arquivo:** `components/Hero.tsx` — Client Component (99 linhas)

**Título principal:**
> "Sua empresa precisa parecer do tamanho que ela é."

**Elementos:**
- Eyebrow: "Posicionamento Digital Empresarial"
- H1 com "que ela é." em amarelo
- Subtexto: explica o posicionamento da BBold
- Dois CTAs:
  - `Solicitar diagnóstico` → `/#contato`
  - `Conhecer o método` → `/#metodo`
- Ícone SVG (`/img/icone ID. VISUAL.svg`) flutuante com animação `float` (keyframe inline via `jsx`)
- Indicador de scroll animado

**Animação de entrada:** reveal sequencial com `setTimeout` (200ms + i×130ms) via `useRef`, **não** usa o IntersectionObserver do RevealInit — animação é disparada ao montar o componente.

---

### 5.4.3 Numbers (Estatísticas)

**Arquivo:** `components/Numbers.tsx` — Client Component (71 linhas)

Fundo amarelo (`bg-yellow`). Três métricas com contador animado ao entrar na viewport:

| Valor | Sufixo | Descrição |
|-------|--------|-----------|
| 15 | + | Anos de experiência no mercado |
| 100 | % | Dedicação a resultados mensuráveis |
| 3 | x | Mais autoridade percebida no digital |

**Dados:** hardcoded no componente — não vêm de banco de dados.

**Animação:** `IntersectionObserver` (threshold 0.5) + `requestAnimationFrame` com easing cúbico.

---

### 5.4.4 Serviços

**Arquivo:** `components/Services.tsx` — Client Component (93 linhas)

Grid 3 colunas (1 col mobile, 2 tablet, 3 desktop). 6 cards com stagger de reveal.

| # | Serviço | Entregáveis listados |
|---|---------|----------------------|
| 01 | Gestão de Conteúdo | Posts feed/stories, copywriting, relatório mensal |
| 02 | Tráfego Pago | Meta Ads, Google Ads, criativos de alto impacto |
| 03 | Identidade Visual | ID completa, manual de marca, materiais institucionais |
| 04 | Sites & Landing Pages | Landing pages, sites institucionais, WordPress/Elementor |
| 05 | Google Meu Negócio | Configuração, postagens semanais, gestão de avaliações |
| 06 | Posicionamento de Marca | Estratégia de comunicação, manual, comunicação B2B/B2C |

**Dados:** hardcoded no componente.

**Interação:** hover levanta o card e expande barra amarela na base.

---

### 5.4.5 Método BBold

**Arquivo:** `components/MetodoBBold.tsx` — Server Component (86 linhas)

Seção com `id="metodo"`. Fundo `#f0e8d8`. Watermark "MÉTODO" em amarelo de baixa opacidade.

5 etapas em grid horizontal (1 coluna mobile → 5 colunas lg):

| Etapa | Título | Resumo |
|-------|--------|--------|
| 01 | Diagnóstico | Análise completa da presença digital atual |
| 02 | Posicionamento | Definição de percepção e autoridade de marca |
| 03 | Estrutura Visual | Construção e padronização da identidade |
| 04 | Presença Digital | Sites, redes sociais, GMB integrados |
| 05 | Crescimento e Autoridade | Reconhecimento e confiança duradouros |

CTA: "Iniciar meu diagnóstico" → `/#contato`

---

### 5.4.6 Como Trabalhamos

**Arquivo:** `components/HowWeWork.tsx` — Server Component (58 linhas)

Seção com `id="como-ajudamos"`. Grid 2 colunas (texto + 4 steps).

4 etapas do processo de atendimento:
1. Diagnóstico do negócio
2. Estratégia personalizada
3. Execução com qualidade
4. Análise e evolução

CTA: "Solicitar diagnóstico" → `/#contato`

---

### 5.4.7 Projetos Sob Medida (CustomProjects)

**Arquivo:** `components/CustomProjects.tsx` — Server Component (81 linhas)

Seção com `id="pacotes"`. 4 cenários/situações do cliente em grid 2×2:

| # | Cenário | Serviços associados |
|---|---------|---------------------|
| 01 | Marca do zero | Identidade Visual, GMB, Posts |
| 02 | Presença digital | Social Media, Tráfego Pago, GMB |
| 03 | Site profissional | Site/Landing Page, SEO, WhatsApp |
| 04 | Tudo junto | ID Visual, Site, Social Media, Tráfego |

Não exibe preços. CTA: "Quero uma proposta →" → `/#contato`.

---

### 5.4.8 Preview de Projetos (ProjectsPreview)

**Arquivo:** `components/ProjectsPreview.tsx` — Client Component (102 linhas)

Seção com `id="projetos"`. Exibe apenas projetos com `destaque: true` da função `getProjetosDestaque()` de `data/projetos.ts`.

**Estado das imagens de capa:** ⚠️ **Todas as imagens são placeholders.** O campo `coverImage` aponta para arquivos em `/img/projetos/*.jpg` que **não existem** no repositório. O componente renderiza um número grande (`01`, `02`, `03`) no lugar da imagem.

Cada card exibe:
- Nicho do cliente (badge colorido)
- Nome do cliente + ano
- Título do projeto
- Descrição curta (2 linhas)
- Primeiro resultado (ex: "+180% de contatos") com valor em amarelo

CTAs: "Ver todos os projetos →" (no header e no rodapé da seção) → `/projetos`.

---

### 5.4.9 Quem Somos (About)

**Arquivo:** `components/About.tsx` — Server Component (52 linhas)

Seção com `id="quem-somos"`. Grid 2 colunas.

- Foto real de Bruno Chaves (`/img/foto-site.jpg`) — **✅ arquivo presente no repositório**
- Badge "+20 anos de experiência" (círculo amarelo)
- Texto biográfico (hardcoded)
- Eyebrow: "Quem está por trás"
- Título: "Experiência real. *Resultado* concreto."

---

### 5.4.10 Faixa de CTA (CtaBand)

**Arquivo:** `components/CtaBand.tsx` — Server Component (22 linhas)

Fundo amarelo. Texto: "Sua empresa pronta para transmitir autoridade?"

CTA: "Solicitar diagnóstico" → `/#contato`.

---

### 5.4.11 Contato

**Arquivo:** `components/Contact.tsx` — Client Component (118 linhas)

Seção com `id="contato"`. Grid 2 colunas (informações + formulário).

**Informações de contato:**
- WhatsApp: `(27) 9 9734-1557` → `wa.me/5527997341557`
- E-mail: `contato@agenciabbold.com.br` → `mailto:`
- Localização: "Serra, Espírito Santo" (texto estático, sem link)

**Formulário:**

| Campo | Obrigatoriedade | Tipo |
|-------|----------------|------|
| Nome | ✅ Obrigatório | text |
| Nome da empresa | Opcional | text |
| WhatsApp | ✅ Obrigatório | text (sem máscara) |
| Serviço de interesse | Opcional | select |
| Mensagem | Opcional | textarea |

**Destino do formulário:** ⚠️ **Não envia para backend nem e-mail.** Ao submeter, o formulário constrói uma mensagem formatada com os dados do visitante e abre `wa.me/5527997341557?text=...` em nova aba. Validação mínima: apenas nome e WhatsApp não podem estar vazios. Não há rate limiting, captcha ou armazenamento dos dados.

**Toast de feedback:** aparece por 4 segundos no canto inferior direito — "Redirecionando para o WhatsApp! 🚀" (sucesso) ou mensagem de erro de validação.

---

### 5.4.12 Blog Preview (BlogPreview)

**Arquivo:** `components/BlogPreview.tsx` — Server Component assíncrono (121 linhas)

Busca os 4 posts mais recentes via `latestPostsQuery` do Sanity. **Retorna `null` se não houver posts** — a seção some da homepage.

Cada card exibe:
- Imagem de capa (16/9) com fallback "BBOLD" se não tiver imagem
- Badge de categoria (amarelo)
- Título (2 linhas, clamp)
- Excerpt (2 linhas, clamp)
- Data formatada (dd/mm/aaaa)
- "Ler artigo →" em amarelo

CTA: "Ver todos os artigos →" → `/blog`.

---

## 5.5 Blog (`/blog` e `/blog/[slug]`)

**Tipo de conteúdo:** 100% gerenciado pelo Sanity CMS — não há dados de blog no Supabase.

**Revalidação:** `export const revalidate = 60` — cache de 60 segundos. Novos posts publicados aparecem em até 1 minuto sem rebuild.

### Listagem (`/blog`)

Grid responsivo (1 → 2 → 3 → 4 colunas). Cards com imagem, categoria, título, excerpt, data e tempo de leitura.

Categorias suportadas:

| Slug | Label |
|------|-------|
| `design` | Design |
| `marketing` | Marketing Digital |
| `trafego` | Tráfego Pago |
| `social` | Social Media |
| `negocios` | Negócios |
| `dicas` | Dicas |

### Post Individual (`/blog/[slug]`)

- `generateStaticParams` busca todos os slugs para pré-renderização estática
- Corpo do post renderizado via `PortableText` (rich text do Sanity)
- Imagens de post via CDN do Sanity com `@sanity/image-url`
- `notFound()` se o slug não existir

---

## 5.6 Portfólio (`/projetos` e `/projetos/[slug]`)

**Tipo de conteúdo:** 100% estático — importado de `data/projetos.ts`. Não há gerenciamento pelo painel.

**Projetos cadastrados:** 6+ cases (Escritório de Advocacia, Clínica de Nutrição, Barbearia Kings, + outros).

Cada projeto define:

| Campo | Tipo | Observação |
|-------|------|------------|
| `slug` | string | URL do case |
| `titulo` | string | — |
| `cliente` | string | — |
| `nicho` | string | Usado para badge colorido |
| `descricaoCurta` | string | Exibida nos cards |
| `descricaoCompleta` | string | Exibida no detalhe |
| `servicos` | string[] | Tags de serviços prestados |
| `resultados` | {label, valor}[] | Métricas destacadas |
| `coverImage` | string | Caminho da imagem ⚠️ arquivo ausente |
| `imagens` | string[] | Galeria ⚠️ arrays vazios |
| `ano` | string | — |
| `destaque` | boolean | Se aparece na homepage |

**⚠️ Imagens ausentes:** todos os `coverImage` apontam para `/img/projetos/*.jpg` — a pasta `public/img/projetos/` não existe. O site renderiza placeholders com inicial do título ou número do card.

---

## 5.7 Landing Page de Posicionamento (`/presenca-digital`)

**Arquivo:** `app/(main)/presenca-digital/PresencaDigitalClient.tsx` — Client Component (754 linhas)

Página independente com 9 seções + CTA final. Animações via Framer Motion.

| Seção | Conteúdo |
|-------|---------|
| Hero | Headline, subtexto, CTA WhatsApp, botão de vídeo (placeholder) |
| Prova Social | Checklist de 6 comportamentos do consumidor |
| Antes/Depois | 4 cards comparativos |
| Serviços | Grid 3×2 com 6 serviços e ícones Lucide |
| Timeline | 5 etapas do processo BBold |
| Portfólio | Grid 3×2 com 6 placeholders "Em breve" |
| Sobre | Bio resumido do Bruno |
| Manifesto | Fundo amarelo com frase de impacto |
| Quiz Diagnóstico | 5 perguntas sim/não → resultado com 3 níveis |

**Quiz — Resultados por pontuação:**

| Respostas "Sim" | Label | Mensagem |
|----------------|-------|---------|
| 0–1 | Urgente | Presença digital precisa de atenção imediata |
| 2–3 | Em Desenvolvimento | Base existente, mas faltam consistência e estratégia |
| 4–5 | Bom Caminho | Caminho certo, mas há espaço para crescer |

**Modal de vídeo:** implementado (AnimatePresence), mas exibe "Vídeo em breve" — URL do vídeo não configurada.

**CTAs:** todos apontam para `wa.me/5527997341557` com mensagens pré-formatadas via `?text=...`

---

## 5.8 Diagnóstico Público (`/diagnostico`)

**Arquivo:** `app/diagnostico/page.jsx` — Client Component

Quiz diagnóstico separado da `/presenca-digital`. Profundidade não verificada em leitura completa nesta etapa, mas a página existe e possui CSS próprio (`diagnostico.css`).

---

## 5.9 Link-in-bio (`/bio`)

**Arquivo:** `app/bio/page.tsx` — Server Component com CSS inline

Página autônoma — não usa o layout `(main)` (sem Nav/Footer). Fundo **escuro** (`#0A0A0A`), diferente do restante do site público.

**Conteúdo:**
- Logo SVG animado (float + shadow-pulse)
- Nome: "Agência BBold", handle: "@agencia.bbold"
- 3 botões de link:
  - **WhatsApp** (amarelo, com animação pulse) → `wa.me/5527997341557`
  - **Site** → `agenciabbold.com.br`
  - **Portfólio** → `agenciabbold.com.br/projetos`
- Social strip: Instagram, LinkedIn, e-mail
- Rodapé: "© 2026 BBOLD Studio · Serra, ES"

**⚠️ Problema:** o arquivo importa Google Fonts via `@import url(...)` dentro de inline styles — esta importação pode falhar em ambientes com CSP restritiva.

**Duplicata:** `bio/index.html` (raiz do repo) contém a mesma página em HTML estático legado.

---

## 5.10 SEO e Metadados

### Metadata Global (Root Layout)

```ts
// app/layout.tsx
title: "BBOLD — Posicionamento Digital Empresarial"
description: "Ajudamos empresas a transmitir autoridade..."
openGraph: { url: "https://agenciabbold.com.br", type: "website", locale: "pt_BR" }
```

### Metadata por Página

| Página | Title | Description |
|--------|-------|-------------|
| `/` | (herda root) | (herda root) |
| `/blog` | "Blog — Agência BBold" | "Dicas de design, marketing digital..." |
| `/projetos` | "Projetos — Agência BBold" | "Conheça os projetos desenvolvidos..." |
| `/presenca-digital` | "Posicionamento de Marca | Bruno Chaves" | Com openGraph e Twitter Card |
| `/bio` | "Agência BBold — Links" | "Design Estratégico & Presença Digital..." |

**Ausente:**
- Sitemap (`/sitemap.xml`) — não encontrado
- Robots (`/robots.txt`) — não encontrado
- Schema.org / JSON-LD estruturado
- Canonical URLs explícitas
- OG Images geradas dinamicamente

### Google Analytics

ID `G-QXQ4ZWWBSG` configurado em `app/layout.tsx` via `next/Script` com strategy `afterInteractive`. Rastreia todas as páginas do site.

---

## 5.11 Responsividade

Tailwind CSS com abordagem **mobile-first**. Breakpoints padrão usados: `md` (768px) e `lg` (1024px).

Padrões recorrentes:

| Contexto | Mobile | Desktop |
|----------|--------|---------|
| Grids de cards | 1 coluna | 2–3 colunas |
| Seções 2 colunas | empilhado | lado a lado |
| Navbar | hamburger overlay | menu horizontal |
| Hero | texto apenas | texto + ícone |
| Container | `px-10` + `max-w-site` (1200px) | centrado com padding lateral |

O ícone SVG do Hero (`/img/icone ID. VISUAL.svg`) é `hidden md:block` — não aparece em mobile.

---

## 5.12 Conteúdo Estático vs. Dinâmico

| Elemento | Origem | Editável sem código? |
|----------|--------|----------------------|
| Textos do site (Hero, Serviços, Método, etc.) | Hardcoded nos componentes | ❌ Não |
| Métricas da seção Numbers (15+, 100%, 3x) | Hardcoded no componente | ❌ Não |
| Projetos do portfólio | `data/projetos.ts` | ❌ Não |
| Posts do blog | Sanity CMS | ✅ Sim |
| Imagens dos posts | Sanity CMS (CDN) | ✅ Sim |
| Foto do Bruno (`/img/foto-site.jpg`) | Arquivo estático | ❌ Não (deploy necessário) |

---

## 5.13 Fluxo do Visitante

```
Entrada (orgânica / Instagram / WhatsApp)
  ↓
/ (Homepage)
  ├── Scroll pelas seções institucionais
  ├── Clique em "Conhecer o método" → âncora #metodo
  ├── Clique em "Ver todos os projetos" → /projetos
  ├── Clique em "Blog" → /blog
  └── Clique em qualquer CTA → âncora #contato
         ↓
      Formulário de contato
         ↓ (submissão)
      WhatsApp abre com mensagem pré-formatada
         ↓
      Negociação externa (fora da plataforma)
```

Caminhos alternativos de entrada:
- `/bio` (Instagram link-in-bio) → WhatsApp, Site, Portfólio
- `/presenca-digital` (campanha direta) → Quiz → WhatsApp
- `/diagnostico` (quiz público) → resultado → WhatsApp
- `/blog` (conteúdo orgânico) → artigo → CTA no rodapé

---

## 5.14 Pontos de Conversão

| Ponto | CTA | Destino |
|-------|-----|---------|
| Hero | "Solicitar diagnóstico" | `/#contato` |
| Hero | "Conhecer o método" | `/#metodo` |
| Método BBold | "Iniciar meu diagnóstico" | `/#contato` |
| Como Trabalhamos | "Solicitar diagnóstico" | `/#contato` |
| Projetos Sob Medida | "Quero uma proposta →" | `/#contato` |
| CtaBand | "Solicitar diagnóstico" | `/#contato` |
| Formulário de contato | "Enviar mensagem →" | WhatsApp |
| /presenca-digital quiz | "Falar com especialista →" | WhatsApp direto |
| Footer | WhatsApp | `wa.me/5527997341557` |
| /bio | Fale conosco | WhatsApp direto |

**Observação:** todos os caminhos de conversão levam ao WhatsApp — nenhuma captura de lead em banco de dados ocorre no site público.

---

## 5.15 Falhas e Oportunidades de Melhoria

### Falhas Identificadas

| Problema | Impacto |
|----------|---------|
| Imagens do portfólio ausentes (`public/img/projetos/`) | Portfólio exibe placeholders em produção — prejudica credibilidade |
| Formulário não armazena dados | Leads perdidos se o usuário fechar o WhatsApp antes de enviar |
| Sem captcha ou rate limiting no formulário | Vulnerável a envios automatizados (baixo risco atual, mas escalável) |
| `cream` não definido no `tailwind.config.ts` | `bg-cream` no body do root layout é ignorado; background segue o `globals.css` |
| Importação de Google Fonts via `@import` na `/bio` | Pode falhar com CSP restritiva |
| Sem sitemap.xml ou robots.txt | Indexação pelo Google menos eficiente |
| Sem schema.org | Sem rich snippets nos resultados de busca |
| Estatísticas da seção Numbers hardcoded | Não refletem a realidade se os números mudarem |
| Portfólio não gerenciável pelo painel | Exige deploy para adicionar projetos |

### Oportunidades de Melhoria

| Oportunidade | Benefício |
|-------------|----------|
| Criar tabela `leads` no Supabase + salvar dados do formulário antes de redirecionar ao WhatsApp | Nenhum lead perdido; histórico para follow-up |
| Adicionar imagens reais ao portfólio | Conversão e credibilidade aumentadas |
| Migrar portfólio para Sanity ou Supabase | Gerenciável sem deploy |
| Criar `sitemap.xml` e `robots.txt` | Melhor SEO e rastreamento |
| Adicionar OG Image dinâmica por página | Compartilhamento em redes sociais com preview |
| Adicionar números ao campo WhatsApp do formulário | UX melhorada (máscara `(##) # ####-####`) |
| Configurar `canonical` URLs | Evita conteúdo duplicado no Google |
| Criar `cream` no `tailwind.config.ts` | Consistência entre o que está definido no código e o comportamento real |

---

*Arquivos analisados: `components/Hero.tsx` · `components/Nav.tsx` · `components/Footer.tsx` · `components/Numbers.tsx` · `components/Services.tsx` · `components/MetodoBBold.tsx` · `components/HowWeWork.tsx` · `components/CustomProjects.tsx` · `components/ProjectsPreview.tsx` · `components/About.tsx` · `components/CtaBand.tsx` · `components/Contact.tsx` · `components/BlogPreview.tsx` · `app/(main)/page.tsx` · `app/(main)/layout.tsx` · `app/(main)/blog/page.tsx` · `app/(main)/blog/[slug]/page.tsx` · `app/(main)/projetos/page.tsx` · `app/(main)/projetos/[slug]/page.tsx` · `app/(main)/presenca-digital/PresencaDigitalClient.tsx` · `app/bio/page.tsx` · `app/layout.tsx` · `data/projetos.ts` · `tailwind.config.ts` · `app/globals.css`*
