import React from "react";
import ReactDOM from "react-dom";
import ShowAd from "./components/ShowAd";
import "./styles/app.css";

function App() {
  return (
    <ShowAd />
  );
};

ReactDOM.render(<App />,document.getElementById('root'));