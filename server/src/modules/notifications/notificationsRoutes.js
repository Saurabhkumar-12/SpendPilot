import { Router } from 'express';
import { notificationsController } from './notificationsController.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();
router.use(authGuard);

router.get('/', notificationsController.getNotifications);
router.put('/:id/read', notificationsController.markAsRead);

export default router;
