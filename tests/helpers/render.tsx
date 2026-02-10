import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement } from "react";

// Add providers here as the app grows
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { customRender as render };
