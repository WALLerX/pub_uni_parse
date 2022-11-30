import React, { useState } from "react";
import { createRoot } from 'react-dom/client';
import './styles/styles.scss';
import ShowAdListTable from "./components/ShowAdListTable";
import ShowLeftBar from "./components/ShowLeftBar";
import 'bootstrap';

/*const useExternalHookAsState = (defaultHookState: any) => {
  const [sendMessage, setMessage] = useState(defaultHookState);

  const updateMessage = (e: Event, newMessage: any) => {
    e.preventDefault(); 
    setMessage("newMessage");
  }

  return [sendMessage, updateMessage];
};*/

function App() {
  const [selectedSources, useSourcesState] = useState([]);

  return (
    <main>
      <ShowLeftBar selectedSources={selectedSources} selectSources={useSourcesState}/>
      <ShowAdListTable selectedSources={selectedSources} selectSources={useSourcesState}/>
    </main>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);