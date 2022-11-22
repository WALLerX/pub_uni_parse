import adMongoModel from '../ad.mongo.model';
import * as XLSX from 'xlsx';

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
        try {
          const wb = XLSX.utils.book_new();
          let data_array = [[
            "Район города",
            "Название ЖК",
            "Застройщик",
            "Адрес",
            "Класс жилья",
            "Тип дома (материал)",
            "Тип отделки",
            "Срок сдачи",
            "Цена",
            "Количество жилых комнат",
            "Этаж",
            "Общая площадь",
            "Жилая площадь",
            "Площадь кухни",
            "Телефон",
            "Контактное лицо"
          ]];

          let i = 1; 
           
          result.map((item: any) => {
            data_array[i] = [
              item.city_area, //Район города
              item.housing_complex_name, //Название ЖК
              item.developer, //Застройщик
              item.address, //Адрес (улица и дом)
              item.housing_class, //Класс жилья
              item.house_material, //Тип дома (материал)
              item.finish_type, //Тип отделки
              item.deadline, //Срок сдачи
              item.price, // Цена
              item.number_of_living_rooms, //Количество жилых комнат
              item.floor, //Этаж (этаж квартиры / этаж дома)
              item.total_area, //Общая площадь
              item.living_space, //Жилая площадь
              item.kitchen_area, //Площадь кухни
              item.phone_number, //Телефон
              item.contact //Контактное лицо (Имя или организация)
            ];
            i++;
          });

          const wh = XLSX.utils.aoa_to_sheet(data_array);
          XLSX.utils.book_append_sheet(wb, wh, "Объявления", true);

          const fileBuffer = await XLSX.write(wb, { type: "base64" });

          res(fileBuffer);
        } catch {
          rej("error");
        }
      } else {        
        rej(result);
      }
          
    }).then(res=>{return res},err=>{return err});
  };
}

export default new ParseService();