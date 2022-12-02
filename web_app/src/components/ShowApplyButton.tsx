import React from "react"

const ShowApplyButton = (props: any) => {

  function apply() {    
    var date = new Date();
    props.useLoaderState([props.from_action,date.getMilliseconds()]);
  };
  
  return <button type="button" className="btn btn-sm btn-primary" onClick={apply} disabled={props.applyButtonDisabled}>Применить</button>;

};

export default ShowApplyButton;
