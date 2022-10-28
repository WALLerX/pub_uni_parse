import parseService from './services/parse.service';

class Controller {
  async getAction(req: any, res: any) {     
    try {

      let result;

      if(req.query.action == 'start_parse') {
        if(process.env.PARSE_STATUS != "running") {
          parseService.parse_data(req, res);
          return res
          .status(200)
          .send({ info: 'Parser starting!' });
        } else {
          return res
          .status(404)
          .send({ info: 'Parser alredy running!' });
        }

      }
      if(req.query.action == 'get_status') {        
        result = await parseService.get_parse_status();
      }

      if(result)
        return res
          .status(200)
          .send(result);
      else
        return res
          .status(404)
          .send({ error_code: 'parse_data', message: 'cant_parse_data' });
    } catch (err){
        process.env.PARSE_STATUS="stopped";
        return res
          .status(404)
          .send({ error_code: 'parse_data', message: err });
    }
  };
}

export default new Controller();