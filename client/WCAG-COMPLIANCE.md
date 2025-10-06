# WCAG 2.1 Level AA Compliance Guide

## Color Contrast Requirements

### Minimum Contrast Ratios
- **Normal text** (< 18px or < 14px bold): **4.5:1**
- **Large text** (≥ 18px or ≥ 14px bold): **3:1**
- **UI components & icons**: **3:1**

## Approved Text Colors (on white background)

### ✅ WCAG AAA Compliant (7:1+)
```css
text-gray-900  /* 16.1:1 - Optimal for all text */
text-gray-800  /* 11.2:1 - Excellent for body text */
text-gray-700  /*  8.2:1 - Great for body text */
```

### ✅ WCAG AA Compliant (4.5:1+)
```css
text-gray-600  /* 5.2:1 - Good for secondary text */
text-blue-600  /* 5.9:1 - Links & interactive */
text-green-600 /* 4.6:1 - Success states */
text-red-600   /* 5.1:1 - Error states */
text-amber-600 /* 4.8:1 - Warning states */
```

### ⚠️ WCAG AA Large Text Only (3:1+)
```css
text-gray-500  /* 4.1:1 - Use ONLY for ≥18px text */
```

### ❌ NOT WCAG AA Compliant
```css
text-gray-400  /* 2.9:1 - Decorative/disabled states only */
text-gray-300  /* 1.9:1 - Never use for text */
```

## Usage Guidelines

### Body Text (Normal < 18px)
```tsx
// ❌ WRONG - Fails WCAG AA
<p className="text-gray-500">Important information</p>  // 4.1:1 (need 4.5:1)
<p className="text-gray-400">Description</p>           // 2.9:1 ❌

// ✅ CORRECT - WCAG AA Compliant
<p className="text-gray-700">Important information</p>  // 8.2:1 ✅
<p className="text-gray-600">Description</p>           // 5.2:1 ✅
```

### Secondary/Metadata Text
```tsx
// ❌ WRONG
<span className="text-sm text-gray-400">Created: 2024</span>  // Too light

// ✅ CORRECT
<span className="text-sm text-gray-600">Created: 2024</span>  // WCAG AA ✅
```

### Large Headings (≥ 18px)
```tsx
// ✅ OK - Large text has lower requirement (3:1)
<h2 className="text-2xl text-gray-500">Section Title</h2>  // 4.1:1 ✅

// ✅ BETTER - Use darker for consistency
<h2 className="text-2xl text-gray-700">Section Title</h2>  // 8.2:1 ✅
```

### Icons
```tsx
// Decorative icons (non-essential) - can be lighter
<Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />  // OK

// Functional icons (essential) - must meet 3:1
<Icon className="h-5 w-5 text-gray-600" aria-label="Search" />  // ✅
```

### Placeholders
```tsx
// ❌ WRONG
<input className="form-input placeholder-gray-400" />  // 2.9:1 ❌

// ✅ CORRECT
<input className="form-input placeholder-gray-500" />  // 4.1:1 ✅
<input className="form-input placeholder-gray-600" />  // 5.2:1 ✅ (best)
```

### Disabled States
```tsx
// Disabled states are EXEMPT from WCAG requirements
<button disabled className="text-gray-400">Disabled</button>  // OK
```

## Common Issues & Fixes

### Issue 1: Secondary text too light
```diff
-<p className="text-sm text-gray-500">Helper text</p>
+<p className="text-sm text-gray-600">Helper text</p>
```

### Issue 2: Icon labels too light
```diff
-<Phone className="h-4 w-4 mr-2 text-gray-400" />
+<Phone className="h-4 w-4 mr-2 text-gray-600" />
```

### Issue 3: Metadata text
```diff
-<span className="text-gray-500">Updated 2 hours ago</span>
+<span className="text-gray-600">Updated 2 hours ago</span>
```

### Issue 4: Form placeholders
```diff
-className="form-input placeholder-gray-400"
+className="form-input placeholder-gray-500"
```

## Migration Strategy

### Phase 1: Critical Text (Priority 1)
- Body paragraphs
- Form labels
- Error messages
- Important metadata

### Phase 2: Secondary Elements (Priority 2)
- Helper text
- Timestamps
- Captions
- Secondary info

### Phase 3: Decorative (Priority 3)
- Icons (if aria-hidden)
- Dividers
- Borders

## Testing Tools

### Browser DevTools
```javascript
// Check contrast in Chrome DevTools
// 1. Inspect element
// 2. Look for contrast ratio in Styles panel
// 3. Must show ✓ WCAG AA badge
```

### Online Tools
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Colour Contrast Analyser (CCA)
- axe DevTools browser extension

### Automated Testing
```bash
npm install --save-dev @axe-core/react
npm install --save-dev eslint-plugin-jsx-a11y
```

## Quick Reference Card

| Use Case | Recommended Class | Contrast | WCAG |
|----------|------------------|----------|------|
| Headings | `text-gray-900` | 16.1:1 | AAA ✅ |
| Body text | `text-gray-700` | 8.2:1 | AAA ✅ |
| Secondary | `text-gray-600` | 5.2:1 | AA ✅ |
| Large text (18px+) | `text-gray-500` | 4.1:1 | AA ✅ |
| Metadata (small) | `text-gray-600` | 5.2:1 | AA ✅ |
| Icons (functional) | `text-gray-600` | 5.2:1 | AA ✅ |
| Icons (decorative) | `text-gray-400` | 2.9:1 | N/A |
| Disabled | `text-gray-400` | 2.9:1 | N/A |
| Links | `text-blue-600` | 5.9:1 | AA ✅ |
| Error | `text-red-600` | 5.1:1 | AA ✅ |
| Success | `text-green-600` | 4.6:1 | AA ✅ |
| Warning | `text-amber-600` | 4.8:1 | AA ✅ |

## Implementation Checklist

- [ ] Audit all body text (< 18px) - use text-gray-600 minimum
- [ ] Audit all placeholders - use placeholder-gray-500 minimum
- [ ] Audit functional icons - use text-gray-600 minimum
- [ ] Audit link colors - use text-blue-600
- [ ] Test with browser DevTools contrast checker
- [ ] Test with screen reader
- [ ] Add automated a11y tests

---

**Last Updated:** October 2025  
**Compliance Level:** WCAG 2.1 Level AA  
**Target:** 100% compliance for all user-facing text

