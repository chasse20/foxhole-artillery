import React from "react";
import App from "../Model/App";

declare global { interface Window { __appSingleton?: App } }
export const appSingleton: App = ( window.__appSingleton ??= new App() );

export const AppContext = React.createContext<App>( appSingleton );

export function useApp(): App
{
	return React.useContext( AppContext );
}
