import React from "react";
import { createRoot } from "react-dom/client";
import App from "./View/App";
import "./index.css";

const tempRootElement = document.getElementById( "root" );
if ( !tempRootElement )
{
	throw new Error( "Missing #root element" );
}

createRoot( tempRootElement ).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
