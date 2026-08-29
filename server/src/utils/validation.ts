import { z } from "zod";
import { ACTIVITY_CATEGORIES } from "../constants/categories";

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(15, "First name must be at most 15 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(20, "Last name must be at most 20 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/\d/, "Password must include a number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const extensionLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  source: z.literal("browser").default("browser"),
});

export const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const oauthSchema = z.object({
  provider: z.enum(["google", "github"]),
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters").max(60).optional(),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters").max(60).optional(),
  avatar: z
    .union([z.string().url("Avatar must be a valid image URL"), z.literal("")])
    .optional(),
});

export const activityEventSchema = z.object({
  clientEventId: z.string().min(8).max(100),
  website: z.string().min(1).max(255),
  category: z.enum(ACTIVITY_CATEGORIES),
  startTime: z.string().min(1).max(40),
  endTime: z.string().min(1).max(40),
});

export const submitActivitiesSchema = z.object({
  events: z.array(activityEventSchema).min(1).max(500),
});

export const extensionHeartbeatSchema = z.object({
  connected: z.boolean().default(true),
  trackingEnabled: z.boolean(),
  browser: z.string().min(1).max(40).default("Chrome"),
  version: z.string().min(1).max(40).optional(),
  lastSyncedAt: z.string().min(1).max(40).optional(),
});

export const extensionControlSchema = z
  .object({
    trackingEnabled: z.boolean().optional(),
    disconnect: z.boolean().optional(),
  })
  .refine((v) => v.trackingEnabled !== undefined || v.disconnect !== undefined, {
    message: "Provide trackingEnabled or disconnect.",
  });

export const categoryOverrideSchema = z.object({
  website: z.string().min(1).max(255),
  category: z.enum(ACTIVITY_CATEGORIES),
});

export type CategoryOverrideInput = z.infer<typeof categoryOverrideSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ExtensionLoginInput = z.infer<typeof extensionLoginSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ActivityEventInput = z.infer<typeof activityEventSchema>;
export type SubmitActivitiesInput = z.infer<typeof submitActivitiesSchema>;
