import { Schema, model } from 'mongoose';

interface adInterface {  
  city_area: String; //Район города
  housing_complex_name: String; //Название ЖК
  developer: String; //Застройщик
  address: String; //Адрес (улица и дом)
  housing_class: String; //Класс жилья
  house_material: String; //Тип дома (материал)
  finish_type: String; //Тип отделки
  deadline: String; //Срок сдачи
  price: Number; // Цена
  number_of_living_rooms: String; //Количество жилых комнат
  floor: String; //Этаж (этаж квартиры / этаж дома)
  total_area: Number; //Общая площадь
  living_space: Number; //Жилая площадь
  kitchen_area: Number; //Площадь кухни
  phone_number: Number; //Телефон
  contact: String; //Контактное лицо (Имя или организация)
  relevance: Boolean; //Актуальность
  ad_data: {
    ad_id: String, //Номер объявления на сайте
    ad_title: String, //Заголовок объявления
    ad_link: String, //Ссылка на объявление
    ad_public_time: Date, //Дата и время публикации объявления
    ad_update_time: Date, //Дата и время обновления информации
    ad_tag: String //Тег, принадлежность к платформе
  };
};

const adSchema = new Schema<adInterface>({    
  city_area: { type: String }, 
  housing_complex_name: { type: String },
  developer: { type: String },
  address: { type: String },
  housing_class: { type: String },
  house_material: { type: String },
  finish_type: { type: String },
  deadline: { type: String },
  price: { type: Number },
  number_of_living_rooms: { type: String },
  floor: { type: String },
  total_area: { type: Number },
  living_space: { type: Number },
  kitchen_area: { type: Number },
  phone_number: { type: Number, required: true },
  contact: { type: String },
  relevance: { type: Boolean, default:true },
  ad_data: {
    ad_id: { type: String, required: true, index: true }, 
    ad_title: { type: String }, 
    ad_link: { type: String }, 
    ad_public_time: { type: Date }, 
    ad_update_time: { type: Date },
    ad_tag: { type: String, required: true }
  }  
});

export default model<adInterface>('ad', adSchema);