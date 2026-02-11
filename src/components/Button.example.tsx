/**
 * Button Component Usage Examples
 *
 * This file demonstrates all the variants and options available for the Button component.
 * Based on the PrimeTime design system.
 */

import Button from "./Button";

export default function ButtonExamples() {
  return (
    <div className="p-8 space-y-12 max-w-4xl mx-auto">
      <section>
        <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Button Sizes</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Buttons with Icons</h2>
        <div className="flex flex-wrap gap-4 items-center">
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

          <Button
            variant="secondary"
            iconAfter={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path d="M6 12l4-4-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            Next Step
          </Button>

          <Button
            variant="ghost"
            iconBefore={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                <path d="M10 6L6 10M6 6l4 4" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          >
            Close
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Full Width Buttons</h2>
        <div className="space-y-3 max-w-md">
          <Button fullWidth>Full Width Primary</Button>
          <Button variant="secondary" fullWidth>Full Width Secondary</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Button States</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button disabled>Disabled Button</Button>
          <Button isLoading>Loading Button</Button>
          <Button variant="secondary" disabled>Disabled Secondary</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Real-World Examples</h2>
        <div className="space-y-6">
          {/* Login Page Example */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4">Login Form</h3>
            <div className="space-y-4 max-w-sm">
              <Button fullWidth>Log In</Button>
              <Button variant="ghost" fullWidth>Forgot password?</Button>
            </div>
          </div>

          {/* Dashboard Header Example */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4">Dashboard Header</h3>
            <div className="flex gap-3">
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
              <Button variant="secondary">View All Courses</Button>
            </div>
          </div>

          {/* Modal Footer Example */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4">Modal Footer</h3>
            <div className="flex justify-end gap-3">
              <Button variant="secondary">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          </div>

          {/* Priming Session Example */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <h3 className="text-lg font-semibold mb-4">Priming Session Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                iconBefore={
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3L16 10L5 17V3Z" />
                  </svg>
                }
              >
                Start Session
              </Button>
              <Button variant="secondary" size="sm">5 min read</Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Combined Examples</h2>
        <div className="space-y-4">
          {/* Course Card Actions */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-shadow">
            <h4 className="text-lg font-semibold mb-2">Introduction to Physics</h4>
            <p className="text-sm text-gray-500 mb-4">PHYS 101 • Spring 2026</p>
            <div className="flex gap-2">
              <Button size="sm">View Details</Button>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Props Reference</h2>
        <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm space-y-2">
          <div><strong>variant:</strong> &quot;primary&quot; | &quot;secondary&quot; | &quot;ghost&quot; (default: &quot;primary&quot;)</div>
          <div><strong>size:</strong> &quot;sm&quot; | &quot;default&quot; | &quot;lg&quot; (default: &quot;default&quot;)</div>
          <div><strong>fullWidth:</strong> boolean (default: false)</div>
          <div><strong>iconBefore:</strong> React.ReactNode</div>
          <div><strong>iconAfter:</strong> React.ReactNode</div>
          <div><strong>isLoading:</strong> boolean (default: false)</div>
          <div><strong>disabled:</strong> boolean</div>
          <div><strong>className:</strong> string (additional Tailwind classes)</div>
          <div className="pt-2 text-gray-600">+ all standard button HTML attributes</div>
        </div>
      </section>
    </div>
  );
}
