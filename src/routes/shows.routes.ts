import { Router } from 'express';
import * as showsController from '../controllers/shows';

const router = Router();

router.get('/shows', showsController.getAllShows);
router.get('/shows/:id', showsController.getShowById);
router.get('/shows/:id/episodes', showsController.getShowEpisodes);

export default router;


