import React from "react";
import { createRoot } from 'react-dom/client';
import './styles/styles.scss';
import ShowAdList from "./components/ShowAdList";
import ShowLeftBar from "./components/ShowLeftBar";
import 'bootstrap';

function App() {
  return (
    <main>  
      <ShowLeftBar/>
      <div className="px-3 py-1">
        <ShowAdList/>
      </div>   
    </main>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
