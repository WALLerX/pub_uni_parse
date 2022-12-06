import React, { useEffect } from "react"

const ShowBuilderUpdateCheckAll = (props: any) => {  
  useEffect(() => {
    const list_developers = Array.from(
      document.querySelectorAll('input[id^="flexCheckBuider"]')
    );

    list_developers.map(
      (element: any) => {        
        if(element.defaultChecked) {
          element.checked = props.checkAllDevelopers;
        }
      }
    );

  }, [props.checkAllDevelopers])

  return <div></div>; 
};

export default ShowBuilderUpdateCheckAll;