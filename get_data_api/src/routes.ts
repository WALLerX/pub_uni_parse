import { Router } from 'express';
import controller from './controller';

const router = Router();

let allowCrossDomain = function(req: any, res: any, next: any) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
  }
router.use(allowCrossDomain);

router.route('/api').get(controller.getAction);
router.route('/xlsx').get(controller.getActionXLSX);

export default router;