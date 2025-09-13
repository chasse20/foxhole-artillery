// Required modules
const express = require( "express" );
const path = require( "path" );

// Environment
const PORT = process.env.PORT || 80;

// Initialization
const APP = express();

APP.use( express.json() );
APP.use( express.static( path.join( __dirname, "dist" ) ) );


// Request logging middleware
APP.use( ( tRequest, tResponse, tNext ) =>
{
	const tempTimestamp = new Date().toISOString();
	console.log( `[${tempTimestamp}] ${tRequest.method} ${tRequest.url} - ${tRequest.ip || 'unknown'}` );
	
	tNext();
} );

// SPA
APP.get(
	"/*splat",
	( _, tResponse ) =>
	{
		tResponse.sendFile( path.join( __dirname, "dist", "index.html" ) );
	}
);

// Start
APP.listen(
	PORT,
	"0.0.0.0",
	() =>
	{
		console.log( `Server running on http://localhost:${PORT}` );
	}
);
