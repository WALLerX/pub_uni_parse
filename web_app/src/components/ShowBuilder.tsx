import React from "react"

const ShowBuilder = (props: any) => {

  function enableApplyButton() {
    props.setApplyButtonDisabled(false);
  }

  return (
    <div className="form-check">
      <input data-query={props.data_query} className="form-check-input" type="checkbox" value="" id={props.id} defaultChecked
        onChange={enableApplyButton}
      />
      <label className="form-check-label" htmlFor={props.id}>
        {props.name}
      </label>
    </div>
  )
};

export default ShowBuilder;