import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mapUserRoleToDemoRole } from "@/lib/roles";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body: Record<string, unknown> = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ongeldige login gegevens." },
        { status: 400 },
      );
    }

    const usernameLower = parsed.data.username.toLowerCase();

    const user = await prisma.appUser.findUnique({
      where: { username: usernameLower },
    });

    if (!user || user.password !== parsed.data.password) {
      return NextResponse.json(
        { error: "Gebruikersnaam of wachtwoord is onjuist." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      personId: user.personId ?? null,
    });

    response.cookies.set("demo-role", mapUserRoleToDemoRole(user.role), {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    if (user.personId) {
      response.cookies.set("demo-person-id", user.personId, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
      });
    } else {
      response.cookies.delete("demo-person-id");
    }

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Login error:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? "set" : "not set",
      directUrl: process.env.DIRECT_URL ? "set" : "not set",
      nodeEnv: process.env.NODE_ENV,
    });
    return NextResponse.json(
      { error: `Login failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
