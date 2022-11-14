import React, { useState } from "react"

const ShowSource = (props: any) => {
  return (
    <div className="form-check">
      <input className="form-check-input" type="checkbox" value="" id={props.id} defaultChecked
        onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{ }}
      />
      <label className="form-check-label" htmlFor={props.id}>
        {props.name}
      </label>
    </div>
  )
};

export default ShowSource;