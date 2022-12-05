import React, { useState } from "react"

const ShowDownloadButton = (props: any) => {
  const [isLoaded, setIsLoaded] = useState(true);
  
  function download_file() {
    setIsLoaded(false);

    let sources_query: string = "";
    let developers_query: string = "";

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

    fetch(`http://${window.location.host.replace(/^(\S+):.*/,"$1")}:8095/xlsx?action=get_data${sources_query}${developers_query}`)
      .then(res => res.blob())
      .then(
        (data) => {
          const a = document.createElement("a");
          a.href = window.URL.createObjectURL(data);
          a.download = "Объявления_Недвижимость.xlsx";
          a.click();
          a.remove();

          setIsLoaded(true);
        }
      );
  };

  if (!isLoaded) {
    return <button disabled type="button" className="btn btn-secondary" onClick={download_file}>Формирование файла...</button>;
  } else {
    return <button type="button" className="btn btn-success" onClick={download_file}>Скачать в Excel</button>;
  }

};

export default ShowDownloadButton;
