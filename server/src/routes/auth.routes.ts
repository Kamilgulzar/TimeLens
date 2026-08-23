import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);

router.post("/login", authController.login);
router.post("/logout", authController.logout);

router.post("/extension-login", authController.extensionLogin);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.post("/oauth", authController.oauthLogin);

router.get("/me", authenticate, authController.me);
router.patch("/me", authenticate, authController.updateProfile);

export default router;
