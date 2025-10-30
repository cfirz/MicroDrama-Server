import { Router } from 'express';
import * as ratingsController from '../controllers/ratings';

const router = Router();

router.post('/shows/:id/like', ratingsController.createRating);

export default router;


