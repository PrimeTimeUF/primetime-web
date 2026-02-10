import { test, expect } from "@playwright/test";

test("home page loads successfully", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/PrimeTime/i);
  await expect(page.getByText("Primary Button")).toBeVisible();
});
