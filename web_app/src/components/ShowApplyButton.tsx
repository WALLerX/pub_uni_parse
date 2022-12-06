import React from "react"

const ShowApplyButton = (props: any) => {

  function apply() {    
    var date = new Date();
    props.useLoaderState([props.from_action,date.getMilliseconds()]);
    props.setApplyButtonDisabled(true);
  };
  
  return <button type="button" className="btn btn-primary" onClick={apply} disabled={props.applyButtonDisabled}>Применить фильтр</button>;

};

export default ShowApplyButton;
