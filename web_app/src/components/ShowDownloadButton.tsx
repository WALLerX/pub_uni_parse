import React, { useState } from "react"

const ShowDownloadButton = (props: any) => {
  const [isLoaded, setIsLoaded] = useState(true);
  
  function download_file() {
    setIsLoaded(false);
    fetch(`http://${window.location.host.replace(/^(\S+):.*/,"$1")}:8095/xlsx?action=get_data`)
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
    return <button disabled type="button" className="btn btn-secondary" onClick={download_file}>Скачивание...</button>;
  } else {
    return <button type="button" className="btn btn-success" onClick={download_file}>Скачать в Excel</button>;
  }

};

export default ShowDownloadButton;
