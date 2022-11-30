import adMongoModel from '../ad.mongo.model';

class ParseService {
  
  get_data(...args: string[]) { 
    return new Promise(async (res, rej) => {     

      let result: any;

      if(args.length > 0) {
        const action = args[0];
        const source_re = new RegExp(`^(${args[1].replace(/,/g,"|")})$`);
        const limit = parseInt(args[3]);
        const offset = parseInt(args[4]);
        const developers = args[2];

       // console.log(developers);

        if(action == "get_developers") {          
          result = adMongoModel.find({'ad_data.ad_tag': source_re},{developer:1}).sort({'developer':-1}).distinct("developer");  
        } else{
          if(limit == -1) {
            if(developers.length > 0) {
              const developers_re = new RegExp(`^(${developers.replace(/,/g,"|")})$`);
              result = adMongoModel.find({'developer': developers_re,'ad_data.ad_tag': source_re}).sort({'ad_data.ad_update_time':-1}).skip(offset); 
            } else {
              result = adMongoModel.find({'ad_data.ad_tag': source_re}).sort({'ad_data.ad_update_time':-1}).skip(offset);   
            }
          } else {
            if(developers.length > 0) {
              const developers_re = new RegExp(`^(${developers.replace(/,/g,"|")})$`);
              result = adMongoModel.find({'developer': developers_re,'ad_data.ad_tag': source_re}).sort({'ad_data.ad_update_time':-1}).skip(offset).limit(limit);  
            } else {
              result = adMongoModel.find({'ad_data.ad_tag': source_re}).sort({'ad_data.ad_update_time':-1}).skip(offset).limit(limit); 
            }  
          }
        } 
      } else {
        result = adMongoModel.find({}).sort({'ad_data.ad_update_time':-1});
      }       
      result = await result.exec();

      if(result) {
        res(result);
      } else {        
        rej(result);
      }
          
    }).then(res=>{return res},err=>{return err});
  };
}

export default new ParseService();