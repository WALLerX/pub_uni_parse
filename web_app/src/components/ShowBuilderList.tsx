import React, { useState, useEffect } from "react"
import ShowBuilder from "./ShowBuilder";

const ShowBuilderList = (props: any) => {  
  const [error, setError] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [items, setItems] = useState([]);

  let sources_query: string = "";
  
  useEffect(() => {
    if(props.loaderAction[0] != 'from_developers') {
      const list_sources = Array.from(
        document.querySelectorAll('input[data-type="source_checkbox"]')
      );

      let i = 0;
      let checked_sources_array = Array();

      list_sources.map(
        (element: any)=>{        
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

      fetch(`http://${window.location.host.replace(/^(\S+):.*/,"$1")}:8095/api?action=get_developers${sources_query}`)
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
      }
  }, [props.loaderAction])
  
  let i = 0;
  
  if (error) {
    return <div>Ошибка: {error.message}</div>;
  } else if (!isLoaded) {
    return <div>Загрузка...</div>;
  } else {
    return (
      <div className="overflow-auto flex-column max-h-300px">   
          {items.map((item: any) => (            
            <ShowBuilder {...props} key={i++} id={"flexCheckBuider"+i} name={item} data_query={item} />            
          ))}
      </div>
    );
  }
};

export default ShowBuilderList;