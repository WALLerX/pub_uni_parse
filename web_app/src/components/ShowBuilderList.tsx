import React, { useState, useEffect } from "react"
import ShowBuilder from "./ShowBuilder";

const ShowBuilderList = (props: any) => {  
  const [error, setError] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);
  
  const filter_state = props.current_filter_state;

  console.log(props.current_filter_state);

  useEffect(() => {
    fetch(`http://${window.location.host.replace(/^(\S+):.*/,"$1")}:8095/api?action=get_developers`)
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
  }, [filter_state])
  
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