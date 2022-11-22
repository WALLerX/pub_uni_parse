import React, { useState, useEffect } from "react"
import ShowAd from "./ShowAd";

const ShowAdList = (props: any) => {
  const [error, setError] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`http://${window.location.host.replace(/^(\S+):.*/,"$1")}:8095/api?action=get_data&developers=${encodeURI("АО «Фирма «Культбытстрой»,,АО «СЗ «АРБАН»")}`)
      .then(res => res.json())
      .then(
        (result) => {
          setIsLoaded(true);
          setItems(result);
        },
        (error) => {
          setIsLoaded(true);
          setError(error);
        }
      )
  }, [])
  
  let i = 0;
  
  if (error) {
    return <div className="px-3">Ошибка: {error.message}</div>;
  } else if (!isLoaded) {
    return <div className="px-3">Загрузка...</div>;
  } else {
    return (
      <div className="overflow-auto flex-column h-100 w-100 px-3">   
          {items.map((item: any) => (            
            <ShowAd key={i++} id={"flexCheckBuider"+i} name={item.ad_data.ad_title} />            
          ))}
      </div>
    );
  }
};

export default ShowAdList;