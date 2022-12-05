import React from "react"
import moment from 'moment';


const ShowAd = (props: any) => {
  const relevance_str = (props.item.relevance == true)?"Да":"Нет";
  return (
    <tr>
      <td scope="col">{props.num}</td>
      <td scope="col">{props.item.city_area}</td>
      <td scope="col">{props.item.housing_complex_name}</td>
      <td scope="col">{props.item.developer}</td>
      <td scope="col">{props.item.address}</td>
      <td scope="col">{props.item.housing_class}</td>
      <td scope="col">{props.item.house_material}</td>
      <td scope="col">{props.item.finish_type}</td>
      <td scope="col">{props.item.deadline}</td>
      <td scope="col">{props.item.price}</td>
      <td scope="col">{props.item.number_of_living_rooms}</td>
      <td scope="col">{props.item.floor}</td>
      <td scope="col">{props.item.total_area}</td>
      <td scope="col">{props.item.living_space}</td>
      <td scope="col">{props.item.kitchen_area}</td>
      <td scope="col">{props.item.phone_number}</td>
      <td scope="col">{props.item.contact}</td>
      <td scope="col">{moment(props.item.ad_data.ad_update_time).format('YYYY-MM-DD HH:mm:ss')}</td>
      <td scope="col">{props.item.ad_data.ad_tag}</td>
      <td scope="col">{relevance_str}</td>
    </tr>
  )
};

export default ShowAd;
