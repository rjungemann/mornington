import { Router } from "express";

const router = Router();

router.get('/health_check', (req, res) => {
  console.debug("Health check running");
  res.status(200).json({ message: 'ok' })
});

export default router;