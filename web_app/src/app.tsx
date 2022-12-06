import React, { useState } from "react";
import { createRoot } from 'react-dom/client';
import './styles/styles.scss';
import ShowAdListTable from "./components/ShowAdListTable";
import ShowLeftBar from "./components/ShowLeftBar";
import 'bootstrap';

function App() {
  const [loaderAction, useLoaderState] = useState(['from_load','']);
  const [applyButtonDisabled, setApplyButtonDisabled] = useState(true);

  return (
    <main>
      <ShowLeftBar loaderAction={loaderAction} useLoaderState={useLoaderState} applyButtonDisabled={applyButtonDisabled} setApplyButtonDisabled={setApplyButtonDisabled} />
      <ShowAdListTable loaderAction={loaderAction} useLoaderState={useLoaderState} applyButtonDisabled={applyButtonDisabled} setApplyButtonDisabled={setApplyButtonDisabled} />
    </main>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);