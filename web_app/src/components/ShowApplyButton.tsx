import React from "react"

const ShowApplyButton = (props: any) => {

  function apply() {    
    var date = new Date();
    props.useLoaderState([props.from_action,date.getMilliseconds()]);
    props.setApplyButtonDisabled(true);
  };
  
  const button_class = (props.applyButtonDisabled)?"btn btn-secondary":"btn btn-primary";
  const button_text= (props.applyButtonDisabled)?"Обновление...":"Обновить";

  return <button type="button" className={button_class} onClick={apply} disabled={props.applyButtonDisabled}>{button_text}</button>;

};

export default ShowApplyButton;
