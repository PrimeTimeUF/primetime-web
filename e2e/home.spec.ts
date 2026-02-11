import { test, expect } from "@playwright/test";

test("home page redirects to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/PrimeTime/i);
  await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
});
