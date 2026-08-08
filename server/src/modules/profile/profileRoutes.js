import { Router } from 'express';
import { profileController } from './profileController.js';
import { authGuard } from '../../middleware/authGuard.js';
import { avatarUpload } from '../../middleware/uploadHandler.js';

const router = Router();

router.use(authGuard);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/avatar', avatarUpload.single('avatar'), profileController.uploadAvatar);
router.put('/preferences', profileController.updatePreferences);

export default router;
