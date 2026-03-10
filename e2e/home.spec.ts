import { test, expect } from "@playwright/test";

test("home page renders the landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/PrimeTime/i);
  await expect(page.getByRole("link", { name: "SIGN IN" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /GET STARTED/i }).first()).toBeVisible();
});
