import React, { useState } from "react"

const ShowSelectUnselectAllChekbox = (props: any) => {

  const [selectAllText,changeSelectAllTextState] = useState("Снять выделение со всех");

  function select_unselect_all(e: React.ChangeEvent<HTMLInputElement>) {
    if(e.target.checked) {
      changeSelectAllTextState("Снять выделение со всех");
      props.setCheckAllDevelopers(true);      
    } else {
      changeSelectAllTextState("Выделить все");
      props.setCheckAllDevelopers(false);
    }
  };
  
  return (
    <div className="form-check">
      <input className="form-check-input" type="checkbox" value="" id={props.id} defaultChecked
        onChange={select_unselect_all}
      />
      <label className="form-check-label" htmlFor={props.id}>
        {selectAllText}
      </label>
    </div>
  );
};

export default ShowSelectUnselectAllChekbox;
