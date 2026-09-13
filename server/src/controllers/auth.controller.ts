import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { authService } from "../services/auth.service";
import { signToken, setAuthCookie, clearAuthCookie } from "../services/token.service";
import { handleError } from "../utils/http";
import {
  registerSchema,
  loginSchema,
  extensionLoginSchema,
  emailSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  oauthSchema,
  updateProfileSchema,
  desktopRegisterSchema,
  desktopVerifyEmailSchema,
} from "../utils/validation";

export const authController = {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json({
        message: "verification required",
        email: result.email,
        maskedEmail: result.maskedEmail,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async verifyEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = verifyEmailSchema.parse(req.body);
      const result = await authService.verifyEmail(data);

      res.json({ user: result.user, alreadyVerified: result.alreadyVerified });
    } catch (error) {
      handleError(res, error);
    }
  },

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);

      const token = signToken(result.user.id);
      setAuthCookie(res, token);

      res.json({ user: result.user });
    } catch (error) {
      handleError(res, error);
    }
  },

  async extensionLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = extensionLoginSchema.parse(req.body);
      const result = await authService.login(data);

      // Return a bearer token directly so the browser extension can authenticate
      // its background service worker. The token is the same short-lived JWT the
      // web client uses via cookie.
      const token = signToken(result.user.id);

      res.json({ token, user: result.user });
    } catch (error) {
      handleError(res, error);
    }
  },

  async logout(req: AuthRequest, res: Response): Promise<void> {
    clearAuthCookie(res);
    res.json({ ok: true });
  },

  async forgotPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = emailSchema.parse(req.body);
      await authService.forgotPassword(data);
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error);
    }
  },

  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(data);
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error);
    }
  },

  async oauthLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = oauthSchema.parse(req.body);
      const result = await authService.oauthLogin(data);

      const token = signToken(result.user.id);
      setAuthCookie(res, token);

      res.json({ user: result.user });
    } catch (error) {
      handleError(res, error);
    }
  },

  async extensionOAuthLogin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = oauthSchema.parse(req.body);
      const result = await authService.oauthLogin(data);

      const token = signToken(result.user.id);

      res.json({ token, user: result.user });
    } catch (error) {
      handleError(res, error);
    }
  },

  // ── Desktop-specific auth ──────────────────────────────────────

  async desktopRegister(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = desktopRegisterSchema.parse(req.body);
      const result = await authService.desktopRegister(data);
      res.status(201).json({
        message: "verification required",
        email: result.email,
        maskedEmail: result.maskedEmail,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async desktopVerifyEmail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = desktopVerifyEmailSchema.parse(req.body);
      const result = await authService.desktopVerifyEmail(data);
      res.json({ token: result.token, user: result.user });
    } catch (error) {
      handleError(res, error);
    }
  },

  async desktopResendCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = emailSchema.parse(req.body);
      const result = await authService.desktopResendCode(data.email);
      res.json({ maskedEmail: result.maskedEmail });
    } catch (error) {
      handleError(res, error);
    }
  },

  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.getMe(req.userId as string);
      res.json({ user: result.user });
    } catch (error) {
      handleError(res, error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = updateProfileSchema.parse(req.body);
      const result = await authService.updateProfile(req.userId as string, data);
      res.json({ user: result.user });
    } catch (error) {
      handleError(res, error);
    }
  },
};
