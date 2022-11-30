import React, { useState, useEffect } from "react"
import ShowAd from "./ShowAd";

const ShowAdList = (props: any) => {
  const [error, setError] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);
  
  let sources_query: string;


  useEffect(() => {
    const list_sources = Array.from(
      document.querySelectorAll('input[data-type="source_checkbox"]')
    );

    let i = 0;
    let checked_array = Array();

    list_sources.map(
      (element: any)=>{        
        if(element.checked) {
          checked_array[i] = element.dataset.query;
          i++;
        }
      }
    );
    
    console.log(checked_array);

    if(props.selectedSources.length > 0) {
      sources_query = `&source=${encodeURI(props.selectedSources.toString())}`;
      setIsLoaded(false);
    } else {
      sources_query = "";
    }  

    fetch(`http://${window.location.host.replace(/^(\S+):.*/,"$1")}:8095/api?action=get_data${sources_query}`)
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
  }, [props.selectedSources])
  
  let i = 0;
  
  if (error) {
    return <tbody><tr><td><div className="px-3">Ошибка: {error.message}</div></td></tr></tbody>;
  } else if (!isLoaded) {
    return <tbody><tr><td><div className="px-3">Загрузка...</div></td></tr></tbody>;
  } else {
    return (
      <tbody className="table-bordered">
        {items.map((item: any) => ( 
          <ShowAd key={i++} num={i} id={"flexCheckBuider"+i} item={item} />            
        ))}
      </tbody> 
    );    
  }
};

export default ShowAdList;