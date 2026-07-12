import { ForgotPasswordCard } from "@/features/auth/components/forgot-password-card";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

const { toast, router } = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  router: {
    push: vi.fn(),
    replace: vi.fn(),
  },
}));

let searchParams = new URLSearchParams("email=lucia.kolinska%40gmail.com");

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("sonner", () => ({
  toast,
}));

describe("ForgotPasswordCard", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams("email=lucia.kolinska%40gmail.com");
    toast.success.mockReset();
    toast.error.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("prefills the email from the query string", () => {
    render(<ForgotPasswordCard />);

    expect(
      screen.getByLabelText("Email")
    ).toHaveValue("lucia.kolinska@gmail.com");
  });

  it("submits successfully and shows the confirmation state", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          message:
            "Thank you, if your email is in the system we will email you a reset link. Please check your email account.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    render(<ForgotPasswordCard />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "lucia.kolinska@gmail.com",
        }),
      });
    });

    expect(
      await screen.findByText(
        /if your email is in the system we will email you a reset link/i
      )
    ).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Reset link sent successfully!");
  });

  it("shows the API error message when the request fails", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Password reset is unavailable" }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    render(<ForgotPasswordCard />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password reset is unavailable"
      );
    });
  });
});
