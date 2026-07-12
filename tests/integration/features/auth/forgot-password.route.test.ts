// @vitest-environment node

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

const mailingMock = {
  ensureEmailDeliveryAvailable: vi.fn(),
  generatePasswordResetEmailTemplate: vi.fn(),
  generateVerificationEmailTemplate: vi.fn(),
  sendEmail: vi.fn(),
};

vi.mock("@/prisma/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/mailing-functions", () => mailingMock);

vi.mock("@/lib/s3", () => ({
  uploadToS3: vi.fn(),
  deleteManyFromS3: vi.fn(),
  extractS3KeyFromUrl: vi.fn(),
}));

vi.mock("@/lib/dbService/workspace-invites", () => ({
  getWorkspaceInvite: vi.fn(),
}));

describe("POST /forgot-password", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
    mailingMock.ensureEmailDeliveryAvailable.mockReset();
    mailingMock.generatePasswordResetEmailTemplate.mockReset();
    mailingMock.sendEmail.mockReset();
  });

  it("returns 503 when email delivery is not configured", async () => {
    mailingMock.ensureEmailDeliveryAvailable.mockImplementation(() => {
      throw new Error("missing resend configuration");
    });

    const app = (await import("@/features/auth/server/route")).default;
    const response = await app.request("http://localhost/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "lucia.kolinska@gmail.com" }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error:
        "Password reset is temporarily unavailable. Please try again later.",
    });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns the generic success message even when the user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const app = (await import("@/features/auth/server/route")).default;
    const response = await app.request("http://localhost/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "nobody@example.com" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message:
        "Thank you, if your email is in the system we will email you a reset link. Please check your email account.",
    });
    expect(mailingMock.sendEmail).not.toHaveBeenCalled();
  });

  it("stores a token and sends the reset email when the user exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "lucia.kolinska@gmail.com",
      name: "Lucia",
    });
    prismaMock.user.update.mockResolvedValue({
      id: "user-1",
    });
    mailingMock.generatePasswordResetEmailTemplate.mockResolvedValue(
      "<p>reset</p>"
    );

    const app = (await import("@/features/auth/server/route")).default;
    const response = await app.request("http://localhost/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "lucia.kolinska@gmail.com" }),
    });

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        resetToken: expect.any(String),
        resetTokenExpiry: expect.any(Date),
      },
    });
    expect(mailingMock.sendEmail).toHaveBeenCalledWith(
      "lucia.kolinska@gmail.com",
      "Reset Your Password",
      "<p>reset</p>"
    );
  });
});
