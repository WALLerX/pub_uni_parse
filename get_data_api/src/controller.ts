import getDataService from './services/get_data.service';

class Controller {
  async getAction(req: any, res: any) { 
    let data:any; 
    let action: string;
    let source: string;
    let limit: string;
    let offset: string;

    //console.log(Object.keys(req.query).length);
    
    if(Object.keys(req.query).length > 0) {
     action = (req.query.action && req.query.action.length > 0)?req.query.action:'get_data';
     source = (req.query.source && req.query.source.length > 0)?req.query.source:'domclick,sibdom,avito,cian';
     limit = (req.query.limit && req.query.limit.length > 0)?req.query.limit:'-1';
     offset = (req.query.offset && req.query.offset.length > 0)?req.query.offset:'0';
     
     data = await getDataService.get_data(action,source,limit,offset);
    } else {
      data = await getDataService.get_data();
    }   

    if(Object.keys(data).length > 0)
      return res
        .status(200)
        .send(data);
    else
      return res
        .status(404)
        .send({ error_code: 'get_data', message: 'data not found' });
  };
}

export default new Controller();