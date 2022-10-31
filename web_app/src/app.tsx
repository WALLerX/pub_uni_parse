import React from "react";
import ReactDOM from "react-dom";
import ShowAd from "./components/ShowAd";
import './styles/styles.scss';
import * as bootstrap from 'bootstrap';

function App() {
  return (
    <ShowAd />
  );
};

ReactDOM.render(<App />,document.getElementById('root'));