import { Router } from "express";
import { activityController } from "../controllers/activity.controller";
import { extensionController } from "../controllers/extension.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/", activityController.submit);
router.get("/", activityController.list);
router.get("/summary", activityController.summary);

// Per-user category overrides (reclassify a website for this user only).
router.put("/override", activityController.setOverride);
router.delete("/override", activityController.removeOverride);

// Extension presence & remote tracking control.
router.post("/heartbeat", extensionController.heartbeat);
router.get("/extension-status", extensionController.status);
router.put("/extension-control", extensionController.control);
router.get("/extension-control/pending", extensionController.pending);
router.post("/extension-control/ack", extensionController.acknowledge);

export default router;