import React from "react"
import ShowSource from "./ShowSource";

const ShowSourceList = (props: any) => {
  return (
    <div>
      <ShowSource key={"1"} data_query={"avito"} id={"flexCheckAvito"} name={"Авито"} />
      <ShowSource key={"2"} data_query={"cian"} id={"flexCheckCian"} name={"Циан"} />
      <ShowSource key={"3"} data_query={"domclick"} id={"flexCheckDomclick"} name={"Домклик"} />
      <ShowSource key={"4"} data_query={"sibdom"} id={"flexCheckSibdom"} name={"Сибдом"} />
    </div>
  )
};

export default ShowSourceList;
