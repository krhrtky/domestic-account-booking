# Design Review Specification

**Document Version:** 1.0  
**Date:** 2025-12-19  
**Status:** Draft  
**Author:** Spec & Design Agent

---

## Executive Summary

This specification outlines a comprehensive design review and improvement plan for the household settlement application. The scope is limited to CSS/styling enhancements while maintaining 100% HTML structure compatibility to ensure all E2E tests continue to pass.

---

## 1. Scope

### 1.1 In Scope

**Visual Design Improvements:**
- Color scheme refinement and consistency
- Typography hierarchy optimization
- Spacing and layout rhythm improvements
- Component visual polish (buttons, forms, cards)
- Responsive design enhancements
- Accessibility contrast improvements
- Loading states and transitions
- Error/success state visual clarity

**Files to be Modified (CSS/Tailwind only):**
- `/app/globals.css` - Global styles and CSS variables
- `/tailwind.config.js` - Theme extension and custom utilities
- All `.tsx` files' `className` attributes (styling only)

**Design Pattern Improvements:**
- Establish consistent spacing system (per L-CX-002)
- Define consistent color palette
- Standardize border radius values
- Unify shadow depths
- Create consistent button states (hover, active, disabled)

### 1.2 Non-Goals

**Explicitly Out of Scope:**
- HTML element changes (tags, structure, nesting)
- Changing `data-testid` attributes
- Modifying ARIA attributes or accessibility markup
- Adding/removing form fields or inputs
- Changing component logic or behavior
- Database schema changes
- API endpoint modifications
- Business logic alterations

---

## 2. Constraints

### 2.1 Technical Constraints

**E2E Test Compatibility (MANDATORY):**
- All existing E2E tests must pass without modification
- Visual regression tests may need baseline updates
- Selector-based tests must continue to work (no HTML changes)
- Test data-testid attributes must remain unchanged

**Laws Compliance:**
- **L-CX-002:** UI display consistency must be maintained
  - Currency format: `¥{comma-separated}`
  - Date format: `YYYY年MM月DD日` or `YYYY/MM/DD`
  - Percentage format: `{number}%`
- **L-CX-003:** Error message clarity must be preserved
- **L-CX-004:** Feedback immediacy (100ms visual feedback)
- **L-LC-004:** No prohibited expressions in UI text

**Technology Stack:**
- Tailwind CSS v3.4.17 (existing)
- No new dependencies allowed
- CSS-only solutions preferred over JavaScript

### 2.2 Process Constraints

- Changes must be incremental and reviewable
- Visual regression baselines must be updated with approval
- Design decisions must be documented

---

## 3. Current Design Analysis

### 3.1 Current Styling Approach

**Technology:**
- Tailwind CSS utility-first approach
- Minimal custom CSS in `globals.css`
- No CSS modules or styled-components
- Basic Tailwind configuration with single breakpoint extension

**Current Theme Configuration:**
```javascript
// tailwind.config.js
theme: {
  extend: {
    screens: {
      'xs': '320px',
    },
  },
}
```

### 3.2 Identified Issues

**A. Color Inconsistency**

Current color usage is inconsistent:
- Primary blue: Multiple shades used (`blue-600`, `blue-700`)
- Gray tones: Various grays without defined palette (`gray-50`, `gray-200`, `gray-300`, etc.)
- Success/Error states: Inconsistent green/red usage
- No defined brand colors

**Examples:**
```tsx
// Login button
className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"

// Dashboard link button  
className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"

// Settlement result backgrounds
className='text-green-700 bg-green-50 border-green-200'
className='text-blue-700 bg-blue-50 border-blue-200'
className='text-gray-700 bg-gray-50 border-gray-200'
```

**B. Spacing & Layout Issues**

- Inconsistent padding values (`p-4`, `p-6`, `p-8`)
- No defined spacing scale
- Inconsistent gaps between elements
- Responsive breakpoints underutilized

**Examples:**
```tsx
// Different padding in similar contexts
<div className="bg-white p-6 rounded-lg shadow">  // Dashboard
<div className="border border-gray-200 rounded-md p-4">  // Settlement card
```

**C. Typography Hierarchy**

- Limited use of font weight variations
- No defined type scale
- Inconsistent heading sizes across pages

**Examples:**
```tsx
<h1 className="text-3xl font-bold">Dashboard</h1>
<h2 className="text-2xl font-bold">Settlement Summary</h2>
<h3 className="text-lg font-semibold mb-4">精算サマリー</h3>
<h4 className="text-md font-semibold mb-3">個人の支払い</h4>
```

**D. Component Visual Polish**

**Buttons:**
- Single hover state, no focus-visible styles
- No active/pressed states
- Disabled states lack sufficient contrast
- No loading state animations

**Forms:**
- Basic input styling
- Error states functional but visually basic
- No focus-within enhancements
- Label styling inconsistent

**Cards:**
- Single shadow depth used everywhere
- No elevation hierarchy
- Border radius values vary (`rounded`, `rounded-lg`, `rounded-md`)

**E. Responsive Design**

- Limited mobile optimization
- No tablet-specific breakpoints
- Text sizes don't scale responsively
- Touch targets may be too small on mobile

**F. Accessibility Issues**

- Some color contrasts may not meet WCAG AA
- Focus indicators use browser defaults
- Loading states lack sufficient visual weight

---

## 4. Design Improvement Proposals

### 4.1 Color System

**Define Semantic Color Palette:**

```javascript
// tailwind.config.js extensions
colors: {
  brand: {
    primary: '#2563eb',      // blue-600
    'primary-dark': '#1d4ed8', // blue-700
    'primary-light': '#3b82f6', // blue-500
  },
  semantic: {
    success: '#16a34a',      // green-600
    'success-light': '#dcfce7', // green-50
    warning: '#eab308',      // yellow-500
    'warning-light': '#fef9c3', // yellow-50
    error: '#dc2626',        // red-600
    'error-light': '#fee2e2', // red-50
    info: '#0284c7',         // sky-600
    'info-light': '#e0f2fe', // sky-50
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    700: '#374151',
    900: '#111827',
  }
}
```

**Application:**
- Replace ad-hoc color usage with semantic tokens
- Ensure WCAG AA contrast ratios (4.5:1 text, 3:1 UI components)

### 4.2 Spacing System

**Define Consistent Scale:**

```javascript
// Use Tailwind's default spacing scale consistently
// Primary scale: 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24
// Map to usage:
// - xs: 0.5 (2px)
// - sm: 1 (4px)
// - base: 2 (8px)
// - md: 3 (12px)
// - lg: 4 (16px)
// - xl: 6 (24px)
// - 2xl: 8 (32px)
```

**Component Spacing Standards:**
- Card padding: `p-6` (24px)
- Button padding: `px-4 py-2` (16px/8px)
- Section gaps: `space-y-6` or `space-y-8`
- Form field spacing: `space-y-4`

### 4.3 Typography System

**Font Size Scale:**

```javascript
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
}
```

**Hierarchy Application:**
- H1: `text-3xl font-bold` (Page titles)
- H2: `text-2xl font-semibold` (Section headers)
- H3: `text-xl font-semibold` (Subsection headers)
- H4: `text-lg font-medium` (Component headers)
- Body: `text-base` (default)
- Small: `text-sm` (Secondary text)
- XS: `text-xs` (Captions, labels)

### 4.4 Component Design Standards

**Buttons:**

```tsx
// Primary button
className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium
           hover:bg-brand-primary-dark focus-visible:ring-2 focus-visible:ring-brand-primary
           focus-visible:ring-offset-2 active:scale-[0.98] transition-all
           disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-60"

// Secondary button  
className="px-4 py-2 bg-white text-brand-primary border border-brand-primary rounded-lg font-medium
           hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-brand-primary
           focus-visible:ring-offset-2 active:scale-[0.98] transition-all
           disabled:border-neutral-300 disabled:text-neutral-400"
```

**Form Inputs:**

```tsx
// Base input
className="w-full px-3 py-2 border border-neutral-300 rounded-lg
           focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
           disabled:bg-neutral-100 disabled:cursor-not-allowed
           placeholder:text-neutral-400"

// Error state
className="... border-semantic-error focus:ring-semantic-error"
```

**Cards:**

```tsx
// Elevation levels
// L1 - Base cards
className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"

// L2 - Interactive/hover cards
className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-neutral-200 p-6"

// L3 - Modal/overlay
className="bg-white rounded-lg shadow-lg p-6"
```

### 4.5 Responsive Enhancements

**Breakpoint Strategy:**

```javascript
// Extended breakpoints
screens: {
  'xs': '320px',   // Small phones
  'sm': '640px',   // Large phones
  'md': '768px',   // Tablets
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
}
```

**Application:**
- Font sizes scale up at `md:` breakpoint
- Layout columns adjust at `md:` and `lg:`
- Touch targets minimum 44px on mobile
- Padding/spacing increases at larger breakpoints

### 4.6 Transitions & Loading States

**Standard Transitions:**

```javascript
// Add to tailwind.config.js
transitionDuration: {
  'fast': '100ms',
  'normal': '200ms',
  'slow': '300ms',
}
```

**Loading State Animation:**

```css
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-soft {
  animation: pulse-soft 1.5s ease-in-out infinite;
}
```

---

## 5. Implementation Plan

### 5.1 Phase 1: Foundation (Priority: High)

**Tasks:**
1. Update `tailwind.config.js` with semantic color palette
2. Update `globals.css` with CSS custom properties
3. Define spacing and typography standards
4. Document design tokens in `/docs/design-system.md`

**Deliverables:**
- Updated Tailwind configuration
- Design system documentation
- No visual changes yet (preparation only)

### 5.2 Phase 2: Core Components (Priority: High)

**Tasks:**
1. Refactor button styles across all components
2. Standardize form input styles
3. Unify card component styling
4. Update focus states for accessibility

**Files to Update:**
- `src/components/ui/LoadingButton.tsx`
- `src/components/ui/FormField.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignUpForm.tsx`

**Acceptance Criteria:**
- All buttons use semantic color tokens
- Form inputs have consistent focus states
- Cards use defined elevation system
- E2E tests pass without modification

### 5.3 Phase 3: Layout & Typography (Priority: Medium)

**Tasks:**
1. Apply consistent spacing across pages
2. Implement typography hierarchy
3. Enhance responsive breakpoints
4. Optimize mobile layouts

**Files to Update:**
- `app/dashboard/page.tsx`
- `app/(auth)/login/page.tsx`
- `src/components/settlement/SettlementDashboard.tsx`
- `src/components/settlement/SettlementSummary.tsx`

**Acceptance Criteria:**
- Spacing follows defined scale
- Typography uses semantic sizes
- Mobile layouts are touch-friendly (44px targets)
- E2E tests pass

### 5.4 Phase 4: Polish & Accessibility (Priority: Medium)

**Tasks:**
1. Add transitions to interactive elements
2. Enhance loading state animations
3. Verify WCAG AA contrast ratios
4. Update error/success message styling

**Files to Update:**
- `src/components/ui/LoadingSkeleton.tsx`
- `src/components/ui/ErrorAlert.tsx`
- `src/components/transactions/TransactionList.tsx`

**Acceptance Criteria:**
- All interactive elements have 100ms visual feedback (per L-CX-004)
- Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- Loading states are visually clear
- E2E tests pass

### 5.5 Phase 5: Visual Regression Update (Priority: Low)

**Tasks:**
1. Update VRT baselines with new design
2. Document visual changes
3. Get stakeholder approval

**Files to Update:**
- VRT baseline screenshots
- `/docs/design-changelog.md`

**Acceptance Criteria:**
- All VRT tests pass with new baselines
- Visual changes documented
- Stakeholder approval obtained

---

## 6. Acceptance Criteria

### 6.1 Functional Requirements

- [ ] All existing E2E tests pass without modification
- [ ] No HTML elements changed (tags, structure, nesting)
- [ ] All `data-testid` attributes preserved
- [ ] All ARIA attributes unchanged
- [ ] Form validation behavior identical
- [ ] No JavaScript logic changes

### 6.2 Design Quality Requirements

**Consistency:**
- [ ] Color palette uses semantic tokens (no ad-hoc colors)
- [ ] Spacing follows defined scale (4px/8px/12px/16px/24px/32px)
- [ ] Typography uses hierarchy (h1/h2/h3/h4/body/small/xs)
- [ ] Border radius values standardized (md: 6px, lg: 8px)
- [ ] Shadow depths use 3-level system (sm/base/lg)

**Accessibility:**
- [ ] Text contrast ≥ 4.5:1 (WCAG AA)
- [ ] UI component contrast ≥ 3:1 (WCAG AA)
- [ ] Focus indicators visible on all interactive elements
- [ ] Touch targets ≥ 44px on mobile
- [ ] Color not sole indicator of state (text/icons also used)

**Responsiveness:**
- [ ] Mobile layouts optimized (320px-639px)
- [ ] Tablet layouts functional (640px-1023px)
- [ ] Desktop layouts optimal (1024px+)
- [ ] Text scales appropriately at breakpoints
- [ ] No horizontal scroll at any viewport

**Performance:**
- [ ] Button clicks show feedback within 100ms (L-CX-004)
- [ ] Form submissions show loading state within 200ms
- [ ] Transitions use GPU-accelerated properties only
- [ ] No layout shift during loading states

**Laws Compliance:**
- [ ] L-CX-002: Currency/date/percentage formats unchanged
- [ ] L-CX-003: Error messages preserved
- [ ] L-CX-004: Feedback immediacy maintained
- [ ] L-LC-004: No prohibited UI expressions

### 6.3 Documentation Requirements

- [ ] Design system documented in `/docs/design-system.md`
- [ ] Color palette usage guide created
- [ ] Component styling patterns documented
- [ ] Migration guide for future components
- [ ] Visual changelog created

---

## 7. Testing Strategy

### 7.1 Pre-Implementation Testing

**Baseline Establishment:**
```bash
# Capture current VRT baselines
npm run test:vrt:update

# Run all E2E tests to establish baseline
npm run test:e2e:all

# Verify all tests pass
npm test
```

### 7.2 During Implementation Testing

**Per-Phase Testing:**
```bash
# After each component update
npm run test:e2e -- <related-test-file>

# After CSS changes
npm run lint
npm run type-check

# Visual verification
npm run dev  # Manual review
```

### 7.3 Post-Implementation Testing

**Comprehensive Validation:**
```bash
# All E2E tests must pass
npm run test:e2e:all

# Unit tests
npm test

# Accessibility tests
npm run test:e2e:a11y

# Visual regression tests
npm run test:vrt  # Should FAIL initially
npm run test:vrt:update  # Update with approval

# Final validation
npm run test:e2e:all && npm test && npm run test:vrt
```

### 7.4 Manual Testing Checklist

**Cross-Browser:**
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari/WebKit
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Viewport Sizes:**
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12)
- [ ] 768px (iPad)
- [ ] 1024px (Desktop)
- [ ] 1440px (Large Desktop)

**User Flows:**
- [ ] Login flow
- [ ] Signup flow
- [ ] Create group and invite partner
- [ ] Add transactions manually
- [ ] Upload CSV
- [ ] View settlement summary
- [ ] Filter/paginate transactions
- [ ] Update expense types
- [ ] Adjust ratios
- [ ] Logout

---

## 8. Risk Assessment

### 8.1 High Risks

**Risk:** E2E test failures due to unintended HTML changes  
**Mitigation:** 
- Review each file change carefully
- Run targeted E2E tests after each component update
- Use Git diff to verify only className changes

**Risk:** Visual regression test baseline drift  
**Mitigation:**
- Update baselines only after stakeholder approval
- Document all visual changes
- Keep before/after screenshots

### 8.2 Medium Risks

**Risk:** Accessibility regression (color contrast)  
**Mitigation:**
- Use contrast checker tools during development
- Run automated a11y tests
- Manual testing with screen readers

**Risk:** Performance degradation from excessive CSS  
**Mitigation:**
- Use Tailwind's JIT mode (already enabled)
- Avoid complex CSS animations
- Prefer GPU-accelerated properties (transform, opacity)

### 8.3 Low Risks

**Risk:** Inconsistent styling on edge-case browsers  
**Mitigation:**
- Test on WebKit (Safari) explicitly
- Use standard CSS properties
- Avoid bleeding-edge CSS features

---

## 9. Success Metrics

### 9.1 Quantitative Metrics

- **E2E Test Pass Rate:** 100% (same as baseline)
- **Color Token Usage:** 100% (no hardcoded colors)
- **Spacing Consistency:** ≥95% (use defined scale)
- **Typography Consistency:** 100% (use hierarchy)
- **Accessibility Contrast:** 100% WCAG AA compliance
- **Touch Target Size:** 100% ≥44px on mobile

### 9.2 Qualitative Metrics

- **Visual Coherence:** Professional, polished appearance
- **Brand Consistency:** Unified color and typography
- **User Feedback:** Positive reception to cleaner design
- **Developer Experience:** Easier to maintain with semantic tokens

---

## 10. Rollout Plan

### 10.1 Development Timeline

- **Phase 1 (Foundation):** 1 day
- **Phase 2 (Core Components):** 2 days
- **Phase 3 (Layout & Typography):** 2 days
- **Phase 4 (Polish & Accessibility):** 1 day
- **Phase 5 (VRT Update):** 1 day
- **Total:** 7 days

### 10.2 Review & Approval

- **Design Review:** After Phase 2 completion
- **Accessibility Audit:** After Phase 4 completion
- **Final Approval:** After Phase 5 completion

### 10.3 Deployment

- **Staging:** Deploy after all phases complete
- **Staging Validation:** Run full test suite + manual testing
- **Production:** Deploy after stakeholder approval

---

## 11. Future Considerations

### 11.1 Design System Evolution

- Consider creating a separate design tokens package
- Explore Tailwind plugin for custom utilities
- Document component composition patterns

### 11.2 Advanced Features (Post-MVP)

- Dark mode support (requires HTML changes for theme toggle)
- Custom illustrations (if budget allows)
- Micro-interactions (subtle animations)
- Advanced data visualizations

### 11.3 Maintenance Plan

- Quarterly design review
- Accessibility audit every 6 months
- Update VRT baselines as needed
- Monitor user feedback for pain points

---

## 12. Appendices

### 12.1 Reference Materials

**Laws Compliance:**
- `/docs/laws/01-customer-experience.md` (L-CX-002, L-CX-003, L-CX-004)
- `/docs/laws/03-legal-compliance.md` (L-LC-004)
- `.claude/rules/**__*.tsx.md` (UI component rules)

**Current Implementation:**
- `/tailwind.config.js` - Current theme
- `/app/globals.css` - Global styles
- `/e2e/vrt/visual-regression.spec.ts` - VRT tests

### 12.2 Design Tools

**Recommended Tools:**
- Contrast Checker: https://webaim.org/resources/contrastchecker/
- Color Palette Generator: https://coolors.co/
- Spacing Scale Visualizer: https://www.spacingscale.com/
- Typography Scale: https://typescale.com/

### 12.3 Stakeholder Contact

- **Product Owner:** [To be defined]
- **Design Approval:** [To be defined]
- **Accessibility Review:** [To be defined]

---

## Document Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-19 | 1.0 | Initial specification | Spec & Design Agent |

---

**Next Steps:**

1. Review this specification with stakeholders
2. Get approval to proceed with Phase 1
3. Create `/docs/design-system.md` documentation
4. Begin implementation following the phased plan

