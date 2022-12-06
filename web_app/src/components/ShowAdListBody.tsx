import React, { useState, useEffect } from "react"
import ShowAd from "./ShowAd";

const ShowAdList = (props: any) => {
  const [error, setError] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);
  
  let sources_query: string = "";
  let developers_query: string = "";

  useEffect(() => {
    if(props.loaderAction[0] == 'from_sources' || props.loaderAction[0] == 'from_developers') {
      const list_sources = Array.from(
        document.querySelectorAll('input[data-type="source_checkbox"]')
      );
  
      let i = 0;
      let checked_sources_array = Array();

      list_sources.map(
        (element: any) => {        
          if(element.checked) {
            checked_sources_array[i] = element.dataset.query;
            i++;
          }
        }
      );

      if(checked_sources_array.length > 0) {
        sources_query = `&source=${encodeURI(checked_sources_array.toString())}`;        
        setIsLoaded(false);
      } else {
        sources_query = "";
      }
    }

    if(props.loaderAction[0] == 'from_developers') {
      const list_developers = Array.from(
        document.querySelectorAll('input[id^="flexCheckBuider"]')
      );
  
      let i = 0;
      let checked_developers_array = Array();
      list_developers.map(
        (element: any) => {        
          if(element.checked) {
            checked_developers_array[i] = element.dataset.query;
            i++;
          }
        }
      );

      if(checked_developers_array.length > 0) {
        if(checked_developers_array.toString().length == 0) {
          developers_query = `&developers=${encodeURI(",")}`;
        } else {
          developers_query = `&developers=${encodeURI(checked_developers_array.toString())}`;
        }

        setIsLoaded(false);
      } else {
        developers_query = "";
      }
    }

    fetch(`http://${window.location.host.replace(/^(\S+):.*/,"$1")}:8095/api?action=get_data${sources_query}${developers_query}`)
      .then(res => res.json())
      .then(
        (result) => {
          setIsLoaded(true);
          setItems(result);
          props.setApplyButtonDisabled(false);
        },
        (error) => {
          setIsLoaded(true);
          setError(error);
        }
      )
  }, [props.loaderAction])
  
  let i = 0;
  
  if (error) {
    return <tbody><tr><td><div className="px-3">Ошибка: {error.message}</div></td></tr></tbody>;
  } else if (!isLoaded) {
    return <tbody><tr><td colSpan={20}><div className="fs-5 px-3">Загрузка данных...</div></td></tr></tbody>;
  } else {
    return (
      <tbody className="table-bordered">
        {items.map((item: any) => ( 
          <ShowAd key={i++} num={i} item={item} />            
        ))}
      </tbody> 
    );    
  }
};

export default ShowAdList;