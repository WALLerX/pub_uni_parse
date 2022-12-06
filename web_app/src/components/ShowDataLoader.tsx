import React, { useState, useEffect } from "react"

const ShowDataLoader = (props: any) => {

  const [error, setError] = useState<any>(null);
  const [percentCompleted, setPercentCompleted] = useState(0);
  const [statusCompleted, setStatusCompleted] = useState("stopped");

  useEffect(() => {
    setInterval( () => {
      fetch(`http://${window.location.host.replace(/^(\S+):.*/,"$1")}:${props.port}/api?action=get_status`)
        .then(res => res.json())
        .then(
          (result) => {
            const result_num = (result.percent_completed == null)?0:result.percent_completed;
            setPercentCompleted(result_num);
            setStatusCompleted(result.status);
          },
          (error) => {
            setError(error);
          }
        );
    }, 2000);
  }, []);

  const percentCompletedString = (percentCompleted > 0 && percentCompleted != null)?`${(percentCompleted > 100)?100:percentCompleted} %`:"";
  const progressClassName =  (percentCompleted > 0 && percentCompleted < 100 && statusCompleted == "running")?"progress-bar progress-bar-striped progress-bar-animated":
  (percentCompleted > 0 && percentCompleted < 100 && statusCompleted == "stopped")?"progress-bar bg-danger":
  "progress-bar bg-success";

  return (          
    <div>
      <div className="d-flex justify-content-between">
      <small>{props.name}</small>
      <small>{percentCompletedString}</small>
      </div>
      <div className="progress my-1" style={{height: "5px"}}>
        <div className={progressClassName} role="progressbar" style={{width: `${percentCompleted}%`}} aria-valuenow={percentCompleted} aria-valuemin={0} aria-valuemax={100}></div>
      </div>
    </div>
  )
};

export default ShowDataLoader;
            