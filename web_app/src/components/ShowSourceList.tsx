import React from "react"
import ShowSource from "./ShowSource";

const ShowSourceList = (props: any) => {
  return (
    <div>
      <ShowSource {...props} key={"1"} data_query={"avito"} id={"flexCheckAvito"} name={"Авито"} />
      <ShowSource {...props} key={"2"} data_query={"cian"} id={"flexCheckCian"} name={"Циан"} />
      <ShowSource {...props} key={"3"} data_query={"domclick"} id={"flexCheckDomclick"} name={"Домклик"} />
      <ShowSource {...props} key={"4"} data_query={"sibdom"} id={"flexCheckSibdom"} name={"Сибдом"} />
    </div>
  )
};

export default ShowSourceList;
