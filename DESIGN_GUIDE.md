# Lotten UI/UX Design System & Implementation Guide

> **Core Philosophy**: Lotten is a curated Malaysian Oak furniture brand. The aesthetic embodies **warm minimalism, Japandi/Scandinavian elegance, and artisanal craftsmanship**. Every UI surface must feel deliberate, tactile, and premium. Avoid generic administrative app styling (e.g. unstyled browser selects, cold monochromatic gray boxes, or harsh unpadded buttons).

---

## 1. Design Tokens & Color Palette

### 1.1 Color Tokens
All color tokens are mapped through CSS custom variables in `src/app/globals.css`:

| Token | CSS Variable | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| **Primary (Warm Amber)** | `--primary` | `#78350f` / `amber-900` | Primary CTAs, key brand accents, active states |
| **Primary Hover** | — | `#92400e` / `amber-800` | Hover states for primary buttons |
| **Secondary (Ivory Warmth)** | `--secondary` | `#fef3e2` / `amber-50` | Filter chips, badge backgrounds, subtle callouts |
| **Background** | `--background` | `#fafafa` | Page background (warm off-white, never stark cold `#fff`) |
| **Card Surface** | `--card` | `#ffffff` | Content cards, product cards, dropdown surfaces |
| **Borders** | `--border` | `#e7e5e4` / `stone-200` | Card borders, dividers, subtle inputs |
| **Muted Text** | `--muted-foreground`| `#78716c` / `stone-500` | Captions, secondary labels, metadata |
| **Body Text** | `--foreground` | `#1c1917` / `stone-900` | High-contrast body text, headings |

* **Rule**: Never use stark cold grays (`gray-200`, `gray-500`) when warm stone/amber neutrals (`stone-200`, `stone-500`, `amber-900`) are available.

---

## 2. Typography System

The project uses two primary fonts configured in `@theme`:
1. **Headings & Editorial**: `font-display` (`Cormorant Garamond`, serif). Used for page titles, hero headers, and brand story sections.
2. **Body & Interface**: `font-sans` (`Inter`, sans-serif). Used for body text, navigation, buttons, and form inputs.
3. **Numbers & Technical Specifications**: `font-sans font-semibold tabular-nums` (sans-serif with tabular figures).

### Typography Scale
* `heading-1`: Display serif (`text-4xl sm:text-5xl font-normal tracking-tight`)
* `heading-2`: Section titles (`text-2xl sm:text-3xl font-medium tracking-tight`)
* `heading-3`: Card and block titles (`text-xl font-medium`)
* `body`: Standard readable body (`text-base leading-relaxed text-stone-700`)
* `caption`: Small labels (`text-xs uppercase tracking-wider font-semibold text-stone-500`)

> [!IMPORTANT]
> **Technical Specifications & Dimensions Rule**:
> Do **NOT** use display serif fonts for technical measurements (e.g. `1500 mm`, `19.2 kg`). Old-style serif numerals have varied descenders that look irregular in CAD/spec contexts. Always use clean sans-serif with `tabular-nums` for dimensions, weights, and carton metrics.

---

## 3. Button Component Standards

### 3.1 Class Composition Requirement
Buttons in Lotten **MUST ALWAYS** pair the base `.btn` utility class with a visual variant:

```tsx
// ✅ CORRECT: Base utility + visual variant
<button className="btn btn-primary">Enquire Now</button>
<Link href="/products" className="btn btn-outline">Browse All Products</Link>

// ❌ INCORRECT: Omission of .btn leads to missing padding and border-radius
<button className="btn-primary">Click Me</button>
```

### 3.2 Button Variants
* **`btn btn-primary`**: Solid warm amber background (`bg-amber-900 text-white`). Used for primary conversions (Checkout, Enquire Now, Submit).
* **`btn btn-secondary`**: Soft amber wash (`bg-amber-50 text-amber-900 border border-amber-200`). Used for secondary actions.
* **`btn btn-outline`**: Crisp white with stone border (`bg-white border border-stone-200 text-stone-800 hover:bg-stone-50`). Used for navigation and filter resets.
* **`btn btn-ghost`**: Transparent with subtle hover effect.

### 3.3 Sizing & Minimum Touch Targets
* Default Button: `h-11 px-5 text-sm font-medium rounded-lg` (WCAG compliant 44px touch target).
* Large Button (`btn-lg`): `h-12 px-7 text-base font-medium rounded-lg`.
* Small Button (`btn-sm`): `h-9 px-3.5 text-xs font-medium rounded-md`.

---

## 4. Form Controls & Filter Bars

### 4.1 Custom Select Dropdowns
Never render unstyled browser-native `<select>` tags. All select pickers must use a wrapped custom presentation with an SVG chevron:

```tsx
<div className="relative w-full sm:w-auto sm:min-w-[200px]">
  <select
    value={value}
    onChange={onChange}
    className="w-full h-11 pl-3.5 pr-10 appearance-none bg-white rounded-lg border border-stone-200 text-sm font-medium text-stone-800 shadow-xs hover:border-amber-600/60 focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all cursor-pointer"
  >
    <option value="">All Categories</option>
  </select>
  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400">
    <ChevronDownIcon className="w-4 h-4" />
  </div>
</div>
```

### 4.2 Avoid Input Width Collisions
* `.input` in `globals.css` sets `width: 100%`. When arranging inputs in flex rows, wrap each control in an explicit container (e.g. `w-full sm:w-64`) to prevent cascading CSS rules from forcing controls into unwanted vertical stacks.
* Place filter controls and "Sort by" on the same horizontal baseline on tablet/desktop viewports (`md:flex-row md:items-center justify-between`).

### 4.3 Active Filter Chips
Whenever filters are applied, provide:
1. Dismissible chips (`bg-amber-50 text-amber-900 border-amber-200`) showing the active filter name and a clear icon (`✕`).
2. A single-click *"Clear all"* button to reset filters without a full page reload.

---

## 5. Specification Cards & Data Layout Guidelines

### 5.1 The 4-Column Balanced Grid
Technical specifications (Width, Depth, Height, Weight) must be arranged in a cohesive, balanced grid:
* **Desktop**: 4 columns (`grid-cols-2 lg:grid-cols-4 gap-4`).
* **Mobile**: 2 columns (`grid-cols-2 gap-3`).
* **Never create single-card centered orphans**: Never place a single centered card (`max-w-md mx-auto`) sandwiched between multi-column rows.

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│    WIDTH     │    DEPTH     │    HEIGHT    │    WEIGHT    │
│   1,500 mm   │    380 mm    │    450 mm    │   19.2 kg    │
│  (59.1 in)   │  (15.0 in)   │  (17.7 in)   │  (42.3 lbs)  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### 5.2 Information Grouping
Separate specifications by user intent:
1. **Product Dimensions**: Intended for customers and interior designers verifying room fit.
2. **Packaging & Logistics**: Intended for shipping, freight, and box clearance (Carton dimensions, CBM volume, packaging type).

### 5.3 Dual-Unit Precision
For an international furniture brand, always provide metric (mm/kg) as the primary figure with imperial conversions (inches/lbs) in a muted secondary caption:
```tsx
<p className="font-sans font-semibold text-xl text-stone-900 tabular-nums">
  {product.width_mm} <span className="text-sm font-normal text-stone-500">mm</span>
</p>
<p className="text-xs text-stone-400 tabular-nums">
  {(product.width_mm / 25.4).toFixed(1)} in
</p>
```

---

## 6. Empty States & Feedback

Empty states must guide the user back to discovery rather than leaving them at a dead end:
1. **Icon**: A soft, rounded icon with warm background halo (`w-16 h-16 rounded-full bg-amber-50`).
2. **Title**: Clear statement (e.g. *"No products found"*).
3. **Contextual Description**: State what was searched/filtered (e.g. *"We couldn't find any pieces in Coffee & Side Table"*).
4. **Action Pair**:
   * Primary Action: *"Clear Filters"* (resets parameters).
   * Secondary Action: *"Browse All Products"* or *"Explore Collections"*.

---

## 7. Tabs & Micro-Interactions

* Tab navigation underlines must align seamlessly with the container border. Use `-mb-px` on the active button so the active border (`border-b-2 border-amber-700`) overlaps and aligns flush with the container's bottom border (`border-b border-stone-200`).
* Avoid layout shift on hover; transitions should be limited to `color`, `border-color`, and `background-color` over `150ms-200ms ease`.
