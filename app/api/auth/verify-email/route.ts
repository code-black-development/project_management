import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appOrigin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://app.localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${appOrigin}/sign-in?error=missing-token`);
  }

  const verificationToken = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.redirect(`${appOrigin}/sign-in?error=invalid-token`);
  }

  if (verificationToken.expires < new Date()) {
    // Clean up expired token
    await prisma.verificationToken
      .delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      })
      .catch(() => null);

    return NextResponse.redirect(`${appOrigin}/sign-in?error=expired-token`);
  }

  // Mark email as verified
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  // Delete used token
  await prisma.verificationToken
    .delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    })
    .catch(() => null);

  return NextResponse.redirect(`${appOrigin}/sign-in?verified=1`);
}
