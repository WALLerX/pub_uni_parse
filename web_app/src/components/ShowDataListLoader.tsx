import React from "react"
import ShowDataLoader from "./ShowDataLoader";

const ShowDataListLoader = (props: any) => {
  return (
    <div>
      <ShowDataLoader name={"Авито"} port={8090} />
      <ShowDataLoader name={"Циан"} port={8092} />
      <ShowDataLoader name={"Домклик"} port={8091} />
      <ShowDataLoader name={"Сибдом"} port={8093} />
    </div>
  )
};

export default ShowDataListLoader;
