import React from "react"

const ShowAdListHead = (props: any) => {
  return (
    <thead className="table-success">
      <tr>
        <th scope="col">#</th>
        <th scope="col">Район города</th>
        <th scope="col">Название ЖК</th>
        <th scope="col">Застройщик</th>
        <th scope="col">Адрес</th>
        <th scope="col">Класс жилья</th>
        <th scope="col">Тип дома (материал)</th>
        <th scope="col">Тип отделки</th>
        <th scope="col">Срок сдачи</th>
        <th scope="col">Цена</th>
        <th scope="col">Количество жилых комнат</th>
        <th scope="col">Этаж</th>
        <th scope="col">Общая площадь</th>
        <th scope="col">Жилая площадь</th>
        <th scope="col">Площадь кухни</th>
        <th scope="col">Цена за кв. метр</th>
        <th scope="col">Телефон</th>
        <th scope="col">Контактное лицо</th>
        <th scope="col">Дата обновления</th>
        <th scope="col">Источник</th>
        <th scope="col">Актуальность (опубликовано)</th>
      </tr>
    </thead>
  )
};

export default ShowAdListHead;
