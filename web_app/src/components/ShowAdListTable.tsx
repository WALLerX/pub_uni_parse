import React from "react"
import ShowAdList from "./ShowAdListBody";
import ShowAdListHead from "./ShowAdListHead";

const ShowAdBlock = (props: any) => {
  return (
    <div className="d-flex flex-column overflow-auto h-100 w-100 table-fix-head">
      <table className="table table-striped table-sm">
        <ShowAdListHead />  
        <ShowAdList {...props} />
      </table>        
    </div>
  )
};

export default ShowAdBlock;
