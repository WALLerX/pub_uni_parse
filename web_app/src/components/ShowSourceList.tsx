import React from "react"
import ShowSource from "./ShowSource";

const ShowSourceList = (props: any) => {
  return (
    <div>
      <ShowSource key={"1"} id={"flexCheckAvito"} name={"Авито"} />
      <ShowSource key={"2"} id={"flexCheckCian"} name={"Циан"} />
      <ShowSource key={"3"} id={"flexCheckDomklick"} name={"Домклик"} />
      <ShowSource key={"4"} id={"flexCheckSibdom"} name={"Сибдом"} />
    </div>
  )
};

export default ShowSourceList;
