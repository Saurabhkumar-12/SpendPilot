import { Router } from 'express';
import { searchController } from './searchController.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();
router.use(authGuard);

router.get('/', searchController.globalSearch);

export default router;
