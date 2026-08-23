import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { extensionService } from "../services/extension.service";
import { handleError } from "../utils/http";
import {
  extensionControlSchema,
  extensionHeartbeatSchema,
} from "../utils/validation";

export const extensionController = {
  /** Extension -> server presence report (also returns pending instructions). */
  async heartbeat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = extensionHeartbeatSchema.parse(req.body);
      const view = await extensionService.heartbeat(req.userId as string, parsed);
      res.json(view);
    } catch (error) {
      handleError(res, error);
    }
  },

  /** Web dashboard reads the extension's current status. */
  async status(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await extensionService.status(req.userId as string));
    } catch (error) {
      handleError(res, error);
    }
  },

  /** Web dashboard sets a desired tracking state / requests disconnect. */
  async control(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = extensionControlSchema.parse(req.body);
      const view = await extensionService.control(req.userId as string, parsed);
      res.json(view);
    } catch (error) {
      handleError(res, error);
    }
  },

  /** Extension polls for instructions it hasn't applied yet. */
  async pending(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await extensionService.pendingControl(req.userId as string));
    } catch (error) {
      handleError(res, error);
    }
  },

  /** Extension acknowledges it applied the pending instructions. */
  async acknowledge(req: AuthRequest, res: Response): Promise<void> {
    try {
      await extensionService.clearControl(req.userId as string);
      res.status(204).end();
    } catch (error) {
      handleError(res, error);
    }
  },
};