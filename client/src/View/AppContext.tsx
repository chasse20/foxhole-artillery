import React from "react";
import App from "../Model/App";

export const AppContext = React.createContext<App | null>( null );

export function useApp(): App
{
	const tempContext = React.useContext( AppContext );
	if ( !tempContext )
	{
		throw new Error( "useApp: AppContext missing" );
	}

	return tempContext;
}
