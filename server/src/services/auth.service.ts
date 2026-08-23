import prisma from "../prisma/client";
import { AppError } from "../utils/errors";
import { hashPassword, comparePassword } from "../utils/password";
import { maskEmail } from "../utils/mask";
import type {
  RegisterInput,
  LoginInput,
  EmailInput,
  VerifyEmailInput,
  ResetPasswordInput,
  OAuthInput,
  UpdateProfileInput,
} from "../utils/validation";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  createdAt: true,
} as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const email = normalizeEmail(input.email);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "Email already registered.");
    }

    const hashedPassword = await hashPassword(input.password);

    await prisma.user.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        password: hashedPassword,
        provider: "local",
      },
    });

    // Email verification is handled by Clerk on the client (email_code).
    return { email, maskedEmail: maskEmail(email) };
  },

  async verifyEmail(input: VerifyEmailInput) {
    const email = normalizeEmail(input.email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError(400, "No account found for this email.");
    }

    if (user.emailVerifiedAt) {
      return { user: publicUser(user), alreadyVerified: true };
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      select: userSelect,
    });

    return { user: publicUser(verifiedUser), alreadyVerified: false };
  },

  async login(input: LoginInput) {
    const email = normalizeEmail(input.email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password || !(await comparePassword(input.password, user.password))) {
      throw new AppError(401, "Invalid email or password.");
    }

    if (!user.emailVerifiedAt) {
      throw new AppError(403, "Please verify your email to continue.", { email });
    }

    return { user: publicUser(user) };
  },

  async forgotPassword(input: EmailInput) {
    // Codes are delivered by Clerk on the client; nothing to do server-side.
    return { ok: true };
  },

  async resetPassword(input: ResetPasswordInput) {
    const email = normalizeEmail(input.email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError(400, "No account found for this email.");
    }

    const hashedPassword = await hashPassword(input.password);

    // The code was verified by Clerk on the client, so password ownership is proven.
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, emailVerifiedAt: new Date() },
    });

    return { ok: true };
  },

  async oauthLogin(input: OAuthInput) {
    const email = normalizeEmail(input.email);
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();

    // The identity was verified by Clerk on the client (OAuth provider).
    // Find or create the user and mark the email as verified.
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          provider: input.provider,
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(input.avatar && { avatar: input.avatar }),
          ...(existing.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
        },
        select: userSelect,
      });
      return { user: publicUser(updated) };
    }

    const created = await prisma.user.create({
      data: {
        firstName: firstName || "Google",
        lastName: lastName || "User",
        email,
        password: null,
        provider: input.provider,
        avatar: input.avatar,
        emailVerifiedAt: new Date(),
      },
      select: userSelect,
    });

    return { user: publicUser(created) };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    return { user: publicUser(user) };
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, "User not found.");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.avatar !== undefined
          ? { avatar: input.avatar === "" ? null : input.avatar }
          : {}),
      },
      select: userSelect,
    });

    return { user: publicUser(updated) };
  },
};
