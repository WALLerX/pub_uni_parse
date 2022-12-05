import React, { useState } from "react"
import ShowApplyButton from "./ShowApplyButton";
import ShowBuilderList from "./ShowBuilderList";
import ShowBuilderUpdateCheckAll from "./ShowBuilderUpdateCheckAll";
import ShowDownloadButton from "./ShowDownloadButton";
import ShowSelectUnselectAllChekbox from "./ShowSelectUnselectAllChekbox";
import ShowSourceList from "./ShowSourceList";

const ShowLeftBar = (props: any) => {
  
  const [applyButtonDisabled, setApplyButtonDisabled] = useState(true);
  const [checkAllDevelopers, setCheckAllDevelopers] = useState(true);
  
  function disableApplyButton() {
    setApplyButtonDisabled(true);
  }

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 bg-light" style={{width:"350px"}}>
      <span className="fs-5">Выгрузка данных</span>
      
      <div className="accordion accordion-flush flex-column mb-auto" id="accordionFlush">
        <div className="accordion-item">
          <h2 className="accordion-header" id="flush-heading1">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapse1" aria-expanded="false" aria-controls="flush-collapseOne"
              onClick={disableApplyButton}
            >
              Источники
            </button>
          </h2>
          <div id="flush-collapse1" className="accordion-collapse collapse" aria-labelledby="flush-heading1" data-bs-parent="#accordionFlush">
            <div className="accordion-body">
              <ShowSourceList {...props} applyButtonDisabled={applyButtonDisabled} setApplyButtonDisabled={setApplyButtonDisabled}/>
              <hr/>
              <ShowApplyButton {...props} applyButtonDisabled={applyButtonDisabled} setApplyButtonDisabled={setApplyButtonDisabled} from_action={"from_sources"} />
            </div>
          </div>
        </div>
        <div className="accordion-item">
          <h2 className="accordion-header" id="flush-heading2">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapse2" aria-expanded="false" aria-controls="flush-collapseOne"
              onClick={disableApplyButton}
            >
              Застройщики              
            </button>
          </h2>
          <div id="flush-collapse2" className="accordion-collapse collapse" aria-labelledby="flush-heading2" data-bs-parent="#accordionFlush">
            <div className="accordion-body">
              <ShowSelectUnselectAllChekbox id={"select_all_checkbox"} checkAllDevelopers={checkAllDevelopers} setCheckAllDevelopers={setCheckAllDevelopers} applyButtonDisabled={applyButtonDisabled} setApplyButtonDisabled={setApplyButtonDisabled}/>
              <ShowBuilderUpdateCheckAll checkAllDevelopers={checkAllDevelopers} setCheckAllDevelopers={setCheckAllDevelopers}/>
              <hr/>
              <ShowBuilderList {...props} applyButtonDisabled={applyButtonDisabled} setApplyButtonDisabled={setApplyButtonDisabled} />
              <hr/>
              <ShowApplyButton {...props} applyButtonDisabled={applyButtonDisabled} setApplyButtonDisabled={setApplyButtonDisabled} from_action={"from_developers"} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center d-grid gap-2">
        <ShowDownloadButton {...props} />
      </div>

      <hr />

      <span className="fs-5">Сбор данных</span> 

      <small>Авито</small>
      <div className="progress my-1" style={{height: "5px"}}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width: "75%"}} aria-valuenow={75} aria-valuemin={0} aria-valuemax={100}></div>
      </div>
      <small>Циан</small>
      <div className="progress my-1" style={{height: "5px"}}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width: "25%"}} aria-valuenow={25} aria-valuemin={0} aria-valuemax={100}></div>
      </div>
      <small>Домклик</small>
      <div className="progress my-1" style={{height: "5px"}}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width: "100%"}} aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}></div>
      </div>
      <small>Сибдом</small>
      <div className="progress my-1" style={{height: "5px"}}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width: "100%"}} aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}></div>
      </div>
      
    </div>
  )
};

export default ShowLeftBar;
