import React, { useState, useEffect } from "react"
import ShowBuilder from "./ShowBuilder";

const ShowBuilderList = (props: any) => {  
  const [error, setError] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);
  console.log(window.location.host.replace(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}).*/,"$1"));
  useEffect(() => {
    fetch(`http://${window.location.host.replace(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}).*/,"$1")}:8095/api?action=get_developers`)
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
    return <div>Ошибка: {error.message}</div>;
  } else if (!isLoaded) {
    return <div>Загрузка...</div>;
  } else {
    return (
      <div className="overflow-auto flex-column max-h-300px">   
          {items.map((item: any) => (            
            <ShowBuilder key={i++} id={"flexCheckBuider"+i} name={item} />            
          ))}
      </div>
    );
  }
};

export default ShowBuilderList;