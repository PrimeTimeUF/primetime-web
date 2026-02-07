# Button Component

A fully-featured, reusable button component built for the PrimeTime design system. Follows the Apple-esque, minimalist black & white aesthetic from the mockups.

**Features:** 3 variants · 3 sizes · icon support · loading state · full width · accessible · fully typed · forwardRef compatible

---

## Quick Reference

Copy-paste snippets for common usage. See detailed sections below for full explanations.

### Import
```tsx
import Button from "@/components/Button";
// or
import { Button } from "@/components";
```

### Variants
```tsx
<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
```

### Sizes
```tsx
<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>
```

### Icons
```tsx
<Button iconBefore={<Icon />}>Text</Button>
<Button iconAfter={<Icon />}>Text</Button>
<Button iconBefore={<Icon />} iconAfter={<Icon />}>Text</Button>
```

### States
```tsx
<Button fullWidth>Full Width Button</Button>
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>
```

### Common Combos
```tsx
{/* Primary CTA */}
<Button size="lg" fullWidth>Get Started</Button>

{/* Create action */}
<Button iconBefore={<PlusIcon />}>Create Course</Button>

{/* Modal footer */}
<div className="flex gap-3 justify-end">
  <Button variant="secondary">Cancel</Button>
  <Button>Save</Button>
</div>

{/* Loading submit */}
<Button type="submit" isLoading={isSubmitting} fullWidth>Submit Form</Button>
```

### Props at a Glance
| Prop | Type | Default |
|------|------|---------|
| `variant` | `"primary"` \| `"secondary"` \| `"ghost"` | `"primary"` |
| `size` | `"sm"` \| `"default"` \| `"lg"` | `"default"` |
| `fullWidth` | `boolean` | `false` |
| `iconBefore` | `ReactNode` | — |
| `iconAfter` | `ReactNode` | — |
| `isLoading` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `className` | `string` | `""` |

Plus all standard HTML `<button>` attributes (`onClick`, `type`, `form`, etc.)

---

## Detailed Usage

### Variants

**Primary (default)** — Black background, white text. Use for main actions.
```tsx
<Button variant="primary">Create Course</Button>
<Button>Log In</Button> {/* primary is the default */}
```

**Secondary** — Light gray background, black text with border. Use for secondary actions.
```tsx
<Button variant="secondary">Cancel</Button>
<Button variant="secondary">View All</Button>
```

**Ghost** — Transparent background, black text. Use for subtle/tertiary actions.
```tsx
<Button variant="ghost">Forgot password?</Button>
<Button variant="ghost">Close</Button>
```

> 💡 **When to use which?** Use `primary` for the single most important action on screen, `secondary` for alternative options, and `ghost` for low-emphasis actions.

### Sizes

**Small** — Compact, for constrained spaces or less important actions.
```tsx
<Button size="sm">5 min read</Button>
```

**Default** — Standard size for most use cases.
```tsx
<Button>Submit</Button>
```

**Large** — Prominent, for hero sections or important CTAs.
```tsx
<Button size="lg">Get Started</Button>
```

### Icons

Add icons before or after button text. Icons automatically inherit the button's text color via `currentColor`.

```tsx
{/* Icon before text */}
<Button
  iconBefore={
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <line x1="8" y1="3" x2="8" y2="13" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="8" x2="13" y2="8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  }
>
  Create Course
</Button>

{/* Icon after text */}
<Button
  iconAfter={
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path d="M6 12l4-4-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  }
  variant="secondary"
>
  Next Step
</Button>
```

### Full Width

```tsx
<Button fullWidth>Log In</Button>
<Button fullWidth variant="secondary">Sign Up</Button>
```

### Loading & Disabled States

```tsx
{/* Loading — shows spinner, auto-disables the button */}
<Button isLoading>Saving...</Button>

{/* With state */}
const [isSubmitting, setIsSubmitting] = useState(false);
<Button isLoading={isSubmitting} onClick={handleSubmit}>Submit</Button>

{/* Disabled */}
<Button disabled>Unavailable</Button>
```

---

## Advanced Usage

### With React Hook Form
```tsx
import { useForm } from "react-hook-form";
import { Button } from "@/components";

function LoginForm() {
  const { handleSubmit, formState: { isSubmitting } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Button type="submit" isLoading={isSubmitting} fullWidth>
        Log In
      </Button>
    </form>
  );
}
```

### As a Link (Next.js)
```tsx
import Link from "next/link";
import Button from "@/components/Button";

<Link href="/courses">
  <Button as="a">View Courses</Button>
</Link>
```

### Custom Styling
```tsx
<Button className="shadow-xl hover:shadow-2xl">Custom Styled</Button>
```

### Forwarding Refs
```tsx
const buttonRef = useRef<HTMLButtonElement>(null);
<Button ref={buttonRef}>Click Me</Button>
```

---

## Real-World Examples

### Login Page
```tsx
<div className="max-w-md mx-auto space-y-4">
  <Button fullWidth>Log In</Button>
  <Button variant="ghost" fullWidth>Forgot password?</Button>
</div>
```

### Dashboard Header
```tsx
<header className="flex items-center justify-between p-6">
  <h1 className="text-2xl font-bold">Your Courses</h1>
  <Button iconBefore={<PlusIcon />}>Create Course</Button>
</header>
```

### Modal Footer
```tsx
<div className="flex justify-end gap-3 p-6 border-t">
  <Button variant="secondary">Cancel</Button>
  <Button>Save Changes</Button>
</div>
```

### Session Start
```tsx
<div className="flex gap-3">
  <Button size="lg" iconBefore={<PlayIcon />}>Start Session</Button>
  <Button variant="secondary" size="sm">5 min read</Button>
</div>
```

### Course Card
```tsx
<div className="rounded-xl border p-6">
  <h3 className="text-lg font-semibold mb-2">Introduction to Physics</h3>
  <p className="text-sm text-gray-500 mb-4">PHYS 101 · Spring 2026</p>
  <div className="flex gap-2">
    <Button size="sm">View Details</Button>
    <Button variant="ghost" size="sm">Edit</Button>
  </div>
</div>
```

---

## Design System Values

| Token | Value |
|-------|-------|
| **Black** | `#000000` — Primary background |
| **Gray-800** | `#262626` — Primary hover |
| **Gray-100** | `#F5F5F5` — Secondary background |
| **Gray-200** | `#E5E5E5` — Borders |
| **White** | `#FFFFFF` — Primary text |

| Size | Padding | Font Size | Border Radius |
|------|---------|-----------|---------------|
| `sm` | `px-4 py-2` | 12px | 0.75rem |
| `default` | `px-6 py-3` | 14px | 0.75rem |
| `lg` | `px-8 py-4` | 16px | 1rem |

**Transitions:** `200ms ease-in-out`

---

## Accessibility

- ✅ Focus indicators with `focus-visible` outline
- ✅ Disabled state reduces opacity and prevents interaction
- ✅ Loading state auto-disables the button
- ✅ Icons wrapped in flex containers with proper spacing
- ✅ Supports all ARIA attributes via spread props
- ✅ Keyboard accessible by default

```tsx
<Button
  aria-label="Close modal"
  aria-describedby="modal-description"
  variant="ghost"
  iconBefore={<CloseIcon />}
>
  Close
</Button>
```

---

## Troubleshooting

**Icons not showing correctly?**
Make sure SVGs use `currentColor` so they inherit the button's text color.
```tsx
// ✅ Good — inherits color
<svg fill="currentColor">...</svg>

// ❌ Bad — hardcoded color
<svg fill="black">...</svg>
```

**Button text not centered?**
The button uses `inline-flex` with `items-center justify-center`. Don't add conflicting display styles.

**Custom styles not applying?**
Use `className` for additional styles — don't try to replace base classes.
```tsx
<Button className="shadow-lg">Click Me</Button>
```

---

## Contributing

When modifying the Button component:

1. Update TypeScript types if adding new props
2. Update this documentation
3. Add examples to `Button.example.tsx`
4. Test all variants and states
5. Verify accessibility with keyboard navigation
6. Check mobile responsiveness

## Related Components

- **Input** — Form input component
- **Card** — Container component with similar styling
