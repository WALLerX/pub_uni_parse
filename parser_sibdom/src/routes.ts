import { Router } from 'express';
import controller from './controller';

const router = Router();

router.route('/api') // управление
  .get(controller.getAction)
 /*.post(profileController.createAction)
  .put(profileController.updateAction)
  .delete(profileController.deleteAction);*/

export default router;