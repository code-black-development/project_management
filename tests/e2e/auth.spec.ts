import { expect, test } from "@playwright/test";

test("marketing homepage renders the primary value proposition", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /manage work at the/i })
  ).toBeVisible();
  await expect(page.getByText("Built for teams that ship")).toBeVisible();
});

test("forgot-password flow prefills email and shows confirmation state", async ({
  page,
}) => {
  await page.route("**/api/users/forgot-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message:
          "Thank you, if your email is in the system we will email you a reset link. Please check your email account.",
      }),
    });
  });

  await page.goto("/forgot-password?email=lucia.kolinska%40gmail.com");

  await expect(page.getByLabel("Email")).toHaveValue(
    "lucia.kolinska@gmail.com"
  );

  await page.getByRole("button", { name: "Send Reset Link" }).click();

  await expect(
    page.getByText(
      "Thank you, if your email is in the system we will email you a reset link. Please check your email account."
    )
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Back to Sign In" })
  ).toBeVisible();
});
