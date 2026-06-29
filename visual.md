# Guia de Identidade Visual — V4 Flow

Documento de referência para reproduzir a identidade visual do **V4 Flow** (CRM V4 Company) em outros sistemas, portais ou materiais digitais.

**Fonte da verdade no código:** `src/index.css`, `tailwind.config.ts`, componentes em `src/components/ui/` e `src/components/Sidebar.tsx`.

**Última revisão:** junho/2026 · extraído do repositório `v4flow-crm`.

---

## 1. Marca e posicionamento

| Item | Valor |
|------|--------|
| Nome do produto | **V4 Flow** |
| Nome curto / sidebar | **FLOW** (ao lado do símbolo V4) |
| Empresa | V4 Company |
| Tagline (login) | *Sistema de CRM para gestão de clientes* |
| Idioma da interface | Português (pt-BR) |
| Tom | Profissional, operacional, denso em dados; prioriza escaneabilidade |

A identidade combina o **vermelho institucional V4** com uma interface **SaaS moderna** (fundo levemente azulado, cards brancos, tipografia neutra, ícones Lucide).

---

## 2. Logo e assets

### Símbolo oficial (uso no app)

```
https://brand.v4company.com/_next/image?url=%2Fimages%2Flogos%2Fsimbolo.webp&w=256&q=75
```

**Onde aparece:**
- Favicon e PWA (`index.html`, `public/manifest.webmanifest`)
- Sidebar (altura ~32px)
- Cabeçalho do Pódio (Análise) — dentro de container com borda/gradiente vermelho
- Tela de login (ícone decorativo alternativo em SVG ondas)

### Wordmark na sidebar

- Símbolo V4 + texto **"FLOW"** em `text-xl font-bold`
- Cor: `slate-800` (light) / `slate-200` (dark)

### Pódio / Analytics (identidade reforçada)

- Label superior: `V4 Flow` — uppercase, `tracking-[0.2em]`, vermelho suave
- Sub-label: `Pódio` — uppercase, âmbar
- Gradiente de progresso: `from-red-600 via-red-500 to-amber-400`
- Modo TV: fundo escuro, acentos âmbar e vermelho

### Cores PWA

| Token | Valor |
|-------|--------|
| `theme_color` | `#dc2626` (red-600) |
| `background_color` | `#000000` |

---

## 3. Paleta de cores

O sistema usa **HSL via CSS variables** (padrão shadcn/ui). Todas as cores semânticas devem ser definidas em HSL sem o wrapper `hsl()` — o Tailwind aplica `hsl(var(--token))`.

### 3.1 Modo claro (`:root`)

| Token | HSL | Hex aprox. | Uso |
|-------|-----|------------|-----|
| `--background` | `216 33% 97%` | `#F5F7FA` | Fundo da aplicação (azul-cinza, não branco puro) |
| `--foreground` | `221 39% 11%` | `#111827` | Texto principal |
| `--card` | `0 0% 100%` | `#FFFFFF` | Cards e superfícies elevadas |
| `--card-foreground` | `221 39% 11%` | `#111827` | Texto em cards |
| `--primary` | `4 90% 58%` | `#F53D2C` | **Vermelho V4** — CTAs, links, item ativo |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Texto sobre primária |
| `--secondary` | `216 20% 94%` | `#EEF1F5` | Fundos secundários |
| `--muted` | `216 20% 94%` | `#EEF1F5` | Áreas discretas |
| `--muted-foreground` | `220 9% 46%` | `#6B7280` | Texto auxiliar / legendas |
| `--accent` | `216 20% 93%` | `#E9EDF2` | Hover em elementos neutros |
| `--destructive` | `0 84% 60%` | `#EF4444` | Erros, exclusão |
| `--border` | `214 32% 91%` | `#E2E8F0` | Bordas (levemente azuladas) |
| `--input` | `214 32% 91%` | `#E2E8F0` | Bordas de inputs |
| `--ring` | `4 90% 58%` | `#F53D2C` | Focus ring |
| `--radius` | `0.5rem` | `8px` | Border radius base |

### 3.2 Modo escuro (`.dark`)

| Token | HSL | Uso |
|-------|-----|-----|
| `--background` | `0 0% 0%` | Preto puro |
| `--foreground` | `0 0% 95%` | Texto principal |
| `--card` | `0 0% 5%` | Cards (#0D0D0D) |
| `--popover` | `0 0% 6%` | Popovers |
| `--primary` | `4 90% 58%` | **Mesmo vermelho V4** |
| `--secondary` / `--muted` | `0 0% 8–9%` | Camadas elevadas mínimas |
| `--border` / `--input` | `0 0% 14%` | Bordas discretas |
| `--destructive` | `0 62.8% 34%` | Erros (mais escuro) |

**Princípio dark mode:** preto neutro com elevação mínima; primária vermelha permanece igual.

### 3.3 Sidebar (tokens dedicados)

Alinhada ao sistema geral: fundo branco (light) / quase preto (dark), primária vermelha, bordas `214 32% 91%`.

### 3.4 Status semânticos (badges utilitários)

| Classe | Fundo (light) | Texto (light) |
|--------|---------------|---------------|
| `.badge-success` | `hsl(141 76% 93%)` | `hsl(140 60% 26%)` |
| `.badge-warning` | `hsl(45 93% 94%)` | `hsl(32 81% 29%)` |
| `.badge-info` | `hsl(214 100% 94%)` | `hsl(221 72% 48%)` |
| `.badge-purple` | `hsl(270 100% 96%)` | `hsl(263 67% 37%)` |

### 3.5 Cores Tailwind usadas diretamente (fora dos tokens)

Muito usadas em métricas, sidebar e login:

| Cor Tailwind | Hex | Uso típico |
|--------------|-----|------------|
| `red-500` / `red-600` / `red-700` | `#EF4444` / `#DC2626` / `#B91C1C` | Primária, login, item ativo sidebar |
| `emerald-400/600` | `#34D399` / `#059669` | Bom / meta atingida |
| `amber-400/500/600` | `#FBBF24` / `#F59E0B` / `#D97706` | Alerta / intermediário |
| `slate-400–800` | escala Slate | Sidebar, textos neutros |
| `green-500/600` | convites, sucesso | Alertas positivos |
| `yellow-500/600` | avisos corporativos | Alertas de acesso |

---

## 4. Tipografia

### Família

Não há fonte customizada carregada. O app usa a **pilha sans-serif do sistema** (padrão Tailwind / shadcn):

```css
font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
```

Para e-mails transacionais no backend: `-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`.

### Hierarquia

| Elemento | Estilo típico |
|----------|----------------|
| Título de página (`h1`) | `text-2xl font-bold` |
| Título de card | `text-2xl font-semibold tracking-tight` |
| Subtítulo / descrição | `text-sm text-muted-foreground` |
| Labels de formulário | `text-xs` ou `text-sm` |
| Seções sidebar | `text-[10px] font-semibold uppercase tracking-widest` |
| Marca Pódio | `text-[10px] font-bold uppercase tracking-[0.2em]` |
| Dados tabulares | `tabular-nums` (números alinhados) |

### Títulos (`h1`–`h6`)

- Light: `hsl(221 39% 11%)`
- Dark: `hsl(213 31% 93%)`

---

## 5. Espaçamento, bordas e elevação

| Token | Valor |
|-------|--------|
| `--radius` | `8px` (`0.5rem`) |
| `rounded-lg` (cards) | `var(--radius)` |
| `rounded-md` (botões, inputs) | `calc(var(--radius) - 2px)` ≈ 6px |
| `rounded-2xl` | Login card, ícones de seção |
| Padding card | `p-6` (24px) |
| Container páginas | `container mx-auto py-6 px-4` |

### Sombras

**Card padrão:**
```css
box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
```

**Classe utilitária `.card-elevated`:**
```css
box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
border: 1px solid hsl(214 32% 91%);
```

**Login card:** `shadow-2xl`

---

## 6. Componentes de interface

Base: **shadcn/ui** (estilo `default`, base `slate`, `cssVariables: true`).

### 6.1 Botões

| Variante | Aparência |
|----------|-----------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` |
| `destructive` | Vermelho erro |
| `outline` | Borda `border-input`, fundo `background` |
| `secondary` | Fundo secondary |
| `ghost` | Sem fundo; hover accent |
| `link` | Texto primary sublinhado |

**Tamanhos:** `default` h-10 · `sm` h-9 · `lg` h-11 · `icon` 40×40

**Login (CTA principal):** override explícito `bg-red-600 hover:bg-red-700 text-white font-semibold`

### 6.2 Badges

- Forma: `rounded-full`
- Padding: `px-2.5 py-0.5`
- Fonte: `text-xs font-semibold`
- Variante default: usa `primary`

### 6.3 Cards

- `rounded-lg border bg-card shadow-[suave]`
- Header/content com `p-6`

### 6.4 Inputs e focus

- Focus: `ring-2 ring-ring ring-offset-2 ring-offset-background`
- Borda: token `--input`

### 6.5 Sidebar — navegação

| Estado | Estilo |
|--------|--------|
| Item ativo | `bg-red-600 text-white font-semibold shadow-sm` |
| Item inativo | `text-slate-600` (light) / `text-white` (dark) |
| Hover inativo | `hover:bg-slate-100` / `hover:bg-neutral-900` |
| Ícone ativo | `text-white` |
| Ícone inativo | `text-slate-400` |
| Badge contador | `bg-amber-500 text-white text-[9px] font-bold` |

Largura: expansível (ícone + label) ou colapsada (só ícones).

### 6.6 Scrollbar

- Largura/altura: 6px
- Thumb: `hsl(var(--border))`, `border-radius: 9999px`
- Hover thumb: `muted-foreground` a 50% opacidade

---

## 7. Semântica de cores em dados (Analytics / CRM)

Padrão universal no produto:

| Significado | Cor |
|-------------|-----|
| Bom / meta OK | `emerald-600` / `emerald-400` (dark) |
| Atenção / intermediário | `amber-600` / `amber-400` |
| Ruim / risco | `red-600` / `red-400` |
| Vazio / N/A | `text-muted-foreground` |

### Regras de threshold (exemplos do código)

| Métrica | Verde | Amarelo | Vermelho |
|---------|-------|---------|----------|
| % positivo genérico | ≥ 70% | ≥ 50% | < 50% |
| % perigo (refação, churn) | < 3% | 3–10% | ≥ 10% |
| % contrato concluído | ≥ 90% | ≥ 80% | < 80% |
| ROI investidor | > 17× | > 15× | ≤ 15× |
| Health Score (display) | ≤ 30% | ≤ 60% | > 60% |

Números monetários: `Intl pt-BR`, BRL, sem decimais na maioria das tabelas. Percentuais: 1 casa decimal. Duração: `Xh Ymin`.

---

## 8. Ícones

- Biblioteca: **Lucide React** (`lucide-react`)
- Tamanho padrão em botões: `16px` (`size-4`)
- Tamanho em navegação sidebar: `16px` (`w-4 h-4`)
- Tamanho em títulos de página: `24px` (`w-6 h-6`) dentro de container `p-2 rounded-lg`

Ícones de seção costumam ter fundo tintado:
- Ex.: Health Score → `bg-red-100 dark:bg-red-900/30` + ícone `text-red-600`

---

## 9. Layout e estrutura de telas

```
┌─────────────────────────────────────────────┐
│ Sidebar (fixa) │ Header mobile + conteúdo   │
│                │                            │
│ Logo + nav     │  container / scroll area   │
│                │                            │
│ User menu      │                            │
└─────────────────────────────────────────────┘
```

- Shell autenticado: `flex h-screen bg-background overflow-hidden`
- Conteúdo: scroll vertical independente
- Login: centralizado, `min-h-screen`, gradiente vermelho full-bleed
- Suporte a **dark mode** via classe `.dark` no `<html>` (`next-themes`, default `system`)

### Gradientes especiais

| Contexto | Classes |
|----------|---------|
| Login | `bg-gradient-to-br from-red-700 to-red-500` (dark: `from-red-900 to-red-700`) |
| Cards cliente (detalhe) | `linear-gradient(135deg, rgba(59,130,246,0.10), rgba(16,185,129,0.08)…)` — azul/verde suave |
| Pódio progress | `from-red-600 via-red-500 to-amber-400` |

---

## 10. Motion e animação

- Biblioteca: **Framer Motion** (sidebar expand/collapse, labels)
- Accordion / collapsible: `0.2s ease-out`
- Transições de cor sidebar: `transition-all duration-150`
- Loading: spinner `border-b-2 border-primary` + `animate-spin`

---

## 11. Snippet para replicar em outro sistema

### CSS variables mínimas (copiar para `:root` e `.dark`)

```css
:root {
  --background: 216 33% 97%;
  --foreground: 221 39% 11%;
  --card: 0 0% 100%;
  --card-foreground: 221 39% 11%;
  --primary: 4 90% 58%;
  --primary-foreground: 0 0% 100%;
  --secondary: 216 20% 94%;
  --muted: 216 20% 94%;
  --muted-foreground: 220 9% 46%;
  --border: 214 32% 91%;
  --ring: 4 90% 58%;
  --radius: 0.5rem;
}

.dark {
  --background: 0 0% 0%;
  --foreground: 0 0% 95%;
  --card: 0 0% 5%;
  --primary: 4 90% 58%;
  --border: 0 0% 14%;
}
```

### Uso

```css
body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.btn-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-radius: calc(var(--radius) - 2px);
}
```

### Checklist de paridade visual

- [ ] Fundo **não** é branco puro — usar `#F5F7FA` ou equivalente
- [ ] Primária é **vermelho V4** (`hsl(4 90% 58%)`), não azul genérico
- [ ] Item de navegação ativo: **vermelho sólido** (`#DC2626`), texto branco
- [ ] Cards brancos com sombra leve sobre fundo azul-cinza
- [ ] Métricas: verde / âmbar / vermelho com significado consistente
- [ ] Números com `tabular-nums`
- [ ] Ícones outline (estilo Lucide)
- [ ] Border radius 8px base
- [ ] Dark mode: preto puro, não cinza azulado
- [ ] Logo V4 Company (símbolo) nos pontos de marca
- [ ] Textos e formatação em **pt-BR**

---

## 12. Referências no repositório

| Arquivo | Conteúdo |
|---------|----------|
| `src/index.css` | Tokens de cor, badges, scrollbar, utilities |
| `tailwind.config.ts` | Mapeamento Tailwind → CSS variables |
| `components.json` | Config shadcn/ui |
| `src/components/ui/button.tsx` | Variantes de botão |
| `src/components/ui/card.tsx` | Card base |
| `src/components/Sidebar.tsx` | Navegação e wordmark |
| `src/components/Login.tsx` | Tela de autenticação |
| `src/components/analytics/analyticsPodiumTheme.ts` | Logo e gradiente Pódio |
| `src/components/analytics/analyticsFormatters.tsx` | Cores semânticas de métricas |
| `index.html` / `public/manifest.webmanifest` | Favicon e PWA |

---

## 13. O que não está no app (usar brand V4 Company)

Para materiais institucionais completos (logo horizontal, tipografia oficial da V4 Company, manual de marca corporativo), consultar o portal de brand:

**https://brand.v4company.com**

O V4 Flow implementa um **subconjunto** dessa identidade, otimizado para produto digital (dashboard CRM), não o manual completo da marca-mãe.
