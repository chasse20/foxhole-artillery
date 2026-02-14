// Required modules
const express = require( "express" );
const expressSession = require( "express-session" );
const path = require( "path" );

// Environment
const PORT = process.env.PORT || 80;
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me";
const COOKIE_SECURE = ( process.env.COOKIE_SECURE || "" ).toLowerCase() === "true";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "";
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "";
const DISCORD_REQUIRED_ROLE_ID = process.env.DISCORD_REQUIRED_ROLE_ID || "";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const DISCORD_AUTH_DISABLED = ( process.env.DISCORD_AUTH_DISABLED || "" ).toLowerCase() === "true";

const TILES_DYNAMIC_CACHE_DELAY = 120000; // two minutes
let TILES_DYNAMIC_CACHE =
{
	fetchedAt: 0,
	expiresAt: 0,
	data: null,
	etags: {}, // { [tileKey]: "etag" }
	expiresByKey: {} // { [tileKey]: epochMs }
};
let TILES_DYNAMIC_IN_FLIGHT = null; // Promise when in progress
const TILES =
[
	{ name: "Olavi's Wake", key: "OlavisWakeHex", position: { q: -6, r: 2 } },

	{ name: "Pari Peak", key: "PariPeakHex", position: { q: -5, r: 1 } },
	{ name: "Palantine Berm", key: "PalantineBermHex", position: { q: -5, r: 2 } },
	{ name: "Oarbreaker Isles", key: "OarbreakerIslesHex", position: { q: -5, r: 3 } },

	{ name: "Kuura Strand", key: "KuuraStrandHex", position: { q: -4, r: 0 } },
	{ name: "The Gutter", key: "TheGutterHex", position: { q: -4, r: 1 } },
	{ name: "Fisherman's Row", key: "FishermansRowHex", position: { q: -4, r: 2 } },
	{ name: "Stema Landing", key: "StemaLandingHex", position: { q: -4, r: 3 } },

	{ name: "Nevish Line", key: "NevishLineHex", position: { q: -3, r: 0 } },
	{ name: "Farranac Coast", key: "FarranacCoastHex", position: { q: -3, r: 1 } },
	{ name: "Westgate", key: "WestgateHex", position: { q: -3, r: 2 } },
	{ name: "Origin", key: "OriginHex", position: { q: -3, r: 3 } },

	{ name: "Callum's Cape", key: "CallumsCapeHex", position: { q: -2, r: -1 } },
	{ name: "Stonecradle", key: "StonecradleHex", position: { q: -2, r: 0 } },
	{ name: "King's Cage", key: "KingsCageHex", position: { q: -2, r: 1 } },
	{ name: "Sableport", key: "SableportHex", position: { q: -2, r: 2 } },
	{ name: "Ash Fields", key: "AshFieldsHex", position: { q: -2, r: 3 } },

	{ name: "Speaking Woods", key: "SpeakingWoodsHex", position: { q: -1, r: -2 } },
	{ name: "The Moors", key: "MooringCountyHex", position: { q: -1, r: -1 } },
	{ name: "The Linn of Mercy", key: "LinnMercyHex", position: { q: -1, r: 0 } },
	{ name: "Loch Mor", key: "LochMorHex", position: { q: -1, r: 1 } },
	{ name: "The Heartlands", key: "HeartlandsHex", position: { q: -1, r: 2 } },
	{ name: "Red River", key: "RedRiverHex", position: { q: -1, r: 3 } },

	{ name: "Basin Sionnach", key: "BasinSionnachHex", position: { q: 0, r: -3 } },
	{ name: "Reaching Trail", key: "ReachingTrailHex", position: { q: 0, r: -2 } },
	{ name: "Callahan's Passage", key: "CallahansPassageHex", position: { q: 0, r: -1 } },
	{ name: "Deadlands", key: "DeadLandsHex", position: { q: 0, r: 0 } },
	{ name: "Umbral Wildwood", key: "UmbralWildwoodHex", position: { q: 0, r: 1 } },
	{ name: "Great March", key: "GreatMarchHex", position: { q: 0, r: 2 } },
	{ name: "Kalokai", key: "KalokaiHex", position: { q: 0, r: 3 } },

	{ name: "Howl County", key: "HowlCountyHex", position: { q: 1, r: -3 } },
	{ name: "Viper Pit", key: "ViperPitHex", position: { q: 1, r: -2 } },
	{ name: "Marban Hollow", key: "MarbanHollowHex", position: { q: 1, r: -1 } },
	{ name: "The Drowned Vale", key: "DrownedValeHex", position: { q: 1, r: 0 } },
	{ name: "Shackled Chasm", key: "ShackledChasmHex", position: { q: 1, r: 1 } },
	{ name: "Acrithia", key: "AcrithiaHex", position: { q: 1, r: 2 } },

	{ name: "Clanshead Valley", key: "ClansheadValleyHex", position: { q: 2, r: -3 } },
	{ name: "Weathered Expanse", key: "WeatheredExpanseHex", position: { q: 2, r: -2 } },
	{ name: "The Clahstra", key: "ClahstraHex", position: { q: 2, r: -1 } },
	{ name: "Allod's Bight", key: "AllodsBightHex", position: { q: 2, r: 0 } },
	{ name: "Terminus", key: "TerminusHex", position: { q: 2, r: 1 } },

	{ name: "Morgen's Crossing", key: "MorgensCrossingHex", position: { q: 3, r: -3 } },
	{ name: "Stlican Shelf", key: "StlicanShelfHex", position: { q: 3, r: -2 } },
	{ name: "Endless Shore", key: "EndlessShoreHex", position: { q: 3, r: -1 } },
	{ name: "Reaver's Pass", key: "ReaversPassHex", position: { q: 3, r: 0 } },

	{ name: "Godcrofts", key: "GodcroftsHex", position: { q: 4, r: -3 } },
	{ name: "Tempest Island", key: "TempestIslandHex", position: { q: 4, r: -2 } },
	{ name: "Wresta", key: "WrestaHex", position: { q: 4, r: -1 } },
	{ name: "Onyx", key: "OnyxHex", position: { q: 4, r: 0 } },

	{ name: "Lykos Isle", key: "LykosIsleHex", position: { q: 5, r: -3 } },
	{ name: "The Fingers", key: "TheFingersHex", position: { q: 5, r: -2 } },
	{ name: "Tyrant Foothills", key: "TyrantFoothillsHex", position: { q: 5, r: -1 } },

	{ name: "Piper's Enclave", key: "PipersEnclaveHex", position: { q: 6, r: -2 } },
];

const GUN_TYPES =
[
	{
		name: "Cremari Mortar",
		rangeMin: 45,
		rangeMax: 80,
		inaccuracyMin: 5.5,
		inaccuracyMax: 12,
		windEffect: 10
	},
	{
		name: "120mm Huber Lariat",
		rangeMin: 100,
		rangeMax: 300,
		inaccuracyMin: 25,
		inaccuracyMax: 35,
		windEffect: 10
	},
	{
		name: "150mm Huber Exalt",
		rangeMin: 100,
		rangeMax: 300,
		inaccuracyMin: 25,
		inaccuracyMax: 35,
		windEffect: 10
	},
	{
		name: "150mm Flood Mk. IX Stain",
		rangeMin: 120,
		rangeMax: 250,
		inaccuracyMin: 25,
		inaccuracyMax: 35,
		windEffect: 10
	},
	{
		name: "300mm Storm Cannon",
		rangeMin: 400,
		rangeMax: 1000,
		inaccuracyMin: 50,
		inaccuracyMax: 50,
		windEffect: 50
	},
	{
		name: "3C Squire",
		rangeMin: 375,
		rangeMax: 500,
		inaccuracyMin: 39,
		inaccuracyMax: 51,
		windEffect: 10
	},
	{
		name: "4C Wasp Nest",
		rangeMin: 375,
		rangeMax: 450,
		inaccuracyMin: 37.5,
		inaccuracyMax: 60,
		windEffect: 10
	},
	{
		name: "4C Skycaller",
		rangeMin: 275,
		rangeMax: 350,
		inaccuracyMin: 37.5,
		inaccuracyMax: 60,
		windEffect: 10
	},
	{
		name: "Intelligence Center",
		rangeMin: 500,
		rangeMax: 2500,
		inaccuracyMin: 0,
		inaccuracyMax: 0,
		windEffect: 0
	}
];

// Initialization
const APP = express();
APP.use( express.json() );

// Request logging middleware
APP.use(
	( tRequest, _, tNext ) =>
	{
		const tempTimestamp = new Date().toISOString();
		console.log( `[${tempTimestamp}] ${tRequest.method} ${tRequest.url} - ${tRequest.ip || 'unknown'}` );
		
		tNext();
	}
);

// Session
APP.set( "trust proxy", 1 );

APP.use(
	expressSession(
		{
			secret: SESSION_SECRET,
			resave: false,
			saveUninitialized: false,
			cookie:
			{
				httpOnly: true,
				sameSite: "lax",
				secure: COOKIE_SECURE
			}
		}
	)
);

// Discord Auth
function GetDiscordAuthorizeURL( tReturnTo )
{
	const tempURL = new URL( "https://discord.com/oauth2/authorize" );

	tempURL.searchParams.set( "client_id", DISCORD_CLIENT_ID );
	tempURL.searchParams.set( "redirect_uri", DISCORD_REDIRECT_URI );
	tempURL.searchParams.set( "response_type", "code" );
	tempURL.searchParams.set( "scope", "identify guilds.members.read" );

	if ( tReturnTo )
	{
		tempURL.searchParams.set( "state", tReturnTo );
	}

	return tempURL.toString();
}

async function GetDiscordCodeForTokenAsync( tCode )
{
	const tempBody = new URLSearchParams();

	tempBody.set( "client_id", DISCORD_CLIENT_ID );
	tempBody.set( "client_secret", DISCORD_CLIENT_SECRET );
	tempBody.set( "grant_type", "authorization_code" );
	tempBody.set( "code", tCode );
	tempBody.set( "redirect_uri", DISCORD_REDIRECT_URI );

	const tempResponse = await fetch(
		"https://discord.com/api/oauth2/token",
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: tempBody
		}
	);

	if ( !tempResponse.ok )
	{
		throw new Error( `Discord token exchange failed: ${tempResponse.status}` );
	}

	return tempResponse.json();
}

async function GetDiscordUserAsync( tAccessToken )
{
	const tempResponse = await fetch(
		"https://discord.com/api/users/@me",
		{
			headers:
			{
				"Authorization": `Bearer ${tAccessToken}`
			}
		}
	);

	if ( !tempResponse.ok )
	{
		throw new Error( `Discord user fetch failed: ${tempResponse.status}` );
	}

	return tempResponse.json();
}

async function GetDiscordGuildMemberAsync( tUserId )
{
	const tempResponse = await fetch(
		`https://discord.com/api/guilds/${encodeURIComponent( DISCORD_GUILD_ID )}/members/${encodeURIComponent( tUserId )}`,
		{
			headers:
			{
				"Authorization": `Bot ${DISCORD_BOT_TOKEN}`
			}
		}
	);

	if ( tempResponse.status === 404 )
	{
		return null;
	}

	if ( !tempResponse.ok )
	{
		throw new Error( `Discord guild member fetch failed: ${tempResponse.status}` );
	}

	return tempResponse.json();
}

function GetIsRequiredRole( tMember )
{
	if ( !tMember || !Array.isArray( tMember.roles ) )
	{
		return false;
	}

	return tMember.roles.includes( DISCORD_REQUIRED_ROLE_ID );
}

async function UseDiscordRoleCheckAsync( tRequest, tResponse, tNext )
{
	try
	{
		// Allow auth endpoints through
		if ( tRequest.path.startsWith( "/auth/" ) || DISCORD_AUTH_DISABLED )
		{
			return tNext();
		}

		const tempSession = tRequest.session || {};
		const tempUserId = tempSession.discordUserId || null;

		if ( !tempUserId )
		{
			const tempReturnTo = tRequest.originalUrl || "/";
			return tResponse.redirect( GetDiscordAuthorizeURL( tempReturnTo ) );
		}

		// Cache role check
		const tempNow = Date.now();
		const tempCachedUntil = tempSession.discordRoleCacheUntil || 0;

		if ( tempSession.discordHasRole && tempNow < tempCachedUntil )
		{
			return tNext();
		}

		const tempMember = await GetDiscordGuildMemberAsync( tempUserId );
		const tempHasRole = GetIsRequiredRole( tempMember );

		tRequest.session.discordHasRole = tempHasRole;
		tRequest.session.discordRoleCacheUntil = tempNow + 60000;

		if ( !tempHasRole )
		{
			return tResponse.status( 403 ).send( "Forbidden" );
		}

		return tNext();
	}
	catch ( tError )
	{
		console.error( "ProcessDiscordRoleCheckAsync error:", tError );
		return tResponse.status( 500 ).send( "Internal server error" );
	}
}

APP.get(
	"/auth/login",
	( tRequest, tResponse ) =>
	{
		const tempReturnTo = tRequest.query && tRequest.query.returnTo ? String( tRequest.query.returnTo ) : "/";
		return tResponse.redirect( GetDiscordAuthorizeURL( tempReturnTo ) );
	}
);

APP.get(
	"/auth/callback",
	async ( tRequest, tResponse ) =>
	{
		try
		{
			const tempCode = tRequest.query && tRequest.query.code ? String( tRequest.query.code ) : null;
			const tempState = tRequest.query && tRequest.query.state ? String( tRequest.query.state ) : "/";

			if ( !tempCode )
			{
				return tResponse.status( 400 ).send( "Missing code" );
			}

			const tempToken = await GetDiscordCodeForTokenAsync( tempCode );
			const tempUser = await GetDiscordUserAsync( tempToken.access_token );

			tRequest.session.discordUserId = tempUser.id;
			tRequest.session.discordUsername = tempUser.username;
			tRequest.session.discordHasRole = false;
			tRequest.session.discordRoleCacheUntil = 0;

			return tResponse.redirect( tempState || "/" );
		}
		catch ( tError )
		{
			console.error( "Auth callback error:", tError );
			return tResponse.status( 500 ).send( "Auth error" );
		}
	}
);

APP.get(
	"/auth/logout",
	( tRequest, tResponse ) =>
	{
		if ( tRequest.session )
		{
			tRequest.session.destroy( () => tResponse.redirect( "/" ) );
			return;
		}

		return tResponse.redirect( "/" );
	}
);

// API
function GetUpstreamExpiresAt( tHeaders, tNowMs )
{
	let tempExpiresAt = 0;
	const tempCC = tHeaders.get( "cache-control" );

	if ( tempCC )
	{
		const tempIsMatch = tempCC.match( /max-age=(\d+)/i );

		if ( tempIsMatch )
		{
			tempExpiresAt = tNowMs + ( parseInt( tempIsMatch[ 1 ], 10 ) * 1000 );
		}
	}

	if ( tempExpiresAt == 0 )
	{
		const tempIsExpires = tHeaders.get( "expires" );
		
		if ( tempIsExpires )
		{
			const tempParsed = Date.parse( tempIsExpires );

			if ( Number.isFinite( tempParsed ) )
			{
				tempExpiresAt = tempParsed;
			}
		}
	}

	if ( tempExpiresAt == 0 )
	{
		tempExpiresAt = tNowMs + TILES_DYNAMIC_CACHE_DELAY;
	}

	return tempExpiresAt;
}

APP.use( UseDiscordRoleCheckAsync );

APP.get(
	"/api/tiles/dynamic",
	async ( _, tResponse ) =>
	{
		try
		{
			let tempNow = Date.now();
			const tempIsFresh = TILES_DYNAMIC_CACHE.data && tempNow < ( TILES_DYNAMIC_CACHE.expiresAt || 0 );

			// Return cache
			if ( tempIsFresh )
			{
				const tempSeconds = Math.max( 0, Math.floor( ( ( TILES_DYNAMIC_CACHE.expiresAt || tempNow ) - tempNow ) / 1000 ) );

				tResponse.setHeader( "Cache-Control", `private, max-age=${tempSeconds}` );
				tResponse.setHeader( "X-Cache", "HIT" );

				return tResponse.json( TILES_DYNAMIC_CACHE.data );
			}
			// Wait if already running, await it
			else if ( TILES_DYNAMIC_IN_FLIGHT )
			{
				const tempResult = await TILES_DYNAMIC_IN_FLIGHT;

				tResponse.setHeader( "Cache-Control", "private, max-age=0" );
				tResponse.setHeader( "X-Cache", "WAIT" );

				return tResponse.json( tempResult );
			}

			// Start a single refresh
			TILES_DYNAMIC_IN_FLIGHT =
			(
				async () =>
				{
					const tempNowInner = Date.now();
					let tempMinExpiresAt = 0;

					const tempEntries = await Promise.all(
						TILES.map(
							async ( tTile ) =>
							{
								try
								{
									const tempPreviousEtag = TILES_DYNAMIC_CACHE.etags && TILES_DYNAMIC_CACHE.etags[ tTile.key ] ? TILES_DYNAMIC_CACHE.etags[ tTile.key ] : null;
									const tempHeaders = { "Accept": "application/json" };

									if ( tempPreviousEtag )
									{
										tempHeaders[ "If-None-Match" ] = tempPreviousEtag;
									}

									const tempURL = `https://war-service-live.foxholeservices.com/api/worldconquest/maps/${encodeURIComponent( tTile.key )}/dynamic/public/`;
									const tempUpstream = await fetch( tempURL, { headers: tempHeaders } );

									// 304: use cached tile value if we have it
									if ( tempUpstream.status === 304 )
									{
										if ( TILES_DYNAMIC_CACHE.data && Object.prototype.hasOwnProperty.call( TILES_DYNAMIC_CACHE.data, tTile.key ) )
										{
											const tempCached = TILES_DYNAMIC_CACHE.data[ tTile.key ];
											const tempTileExpiresAt = GetUpstreamExpiresAt( tempUpstream.headers, tempNowInner );

											if ( !tempMinExpiresAt || tempTileExpiresAt < tempMinExpiresAt )
											{
												tempMinExpiresAt = tempTileExpiresAt;
											}

											TILES_DYNAMIC_CACHE.expiresByKey[ tTile.key ] = tempTileExpiresAt;

											return [ tTile.key, tempCached ];
										}

										return null;
									}
									else if ( tempUpstream.ok )
									{
										const tempEtag = tempUpstream.headers.get( "etag" );

										if ( tempEtag )
										{
											TILES_DYNAMIC_CACHE.etags[ tTile.key ] = tempEtag;
										}

										const tempJSON = await tempUpstream.json();
										const tempTileExpiresAt = GetUpstreamExpiresAt( tempUpstream.headers, tempNowInner );

										TILES_DYNAMIC_CACHE.expiresByKey[ tTile.key ] = tempTileExpiresAt;

										if ( !tempMinExpiresAt || tempTileExpiresAt < tempMinExpiresAt )
										{
											tempMinExpiresAt = tempTileExpiresAt;
										}

										return [ tTile.key, tempJSON ];
									}
								}
								catch ( _ ) { }

								return null;
							}
						)
					);

					const tempFilteredEntries = tempEntries.filter( ( tEntry ) => Array.isArray( tEntry ) );
					const tempResult = Object.fromEntries( tempFilteredEntries );

					// Keep old cache
					if ( tempFilteredEntries.length > 0 )
					{
						const tempFallbackExpiresAt = tempNowInner + TILES_DYNAMIC_CACHE_DELAY;
						const tempExpiresAt = tempMinExpiresAt || tempFallbackExpiresAt;

						TILES_DYNAMIC_CACHE =
						{
							fetchedAt: tempNowInner,
							expiresAt: tempExpiresAt,
							data: tempResult,
							etags: TILES_DYNAMIC_CACHE.etags || {},
							expiresByKey: TILES_DYNAMIC_CACHE.expiresByKey || {}
						};
					}

					return TILES_DYNAMIC_CACHE.data || tempResult;
				}
			)();

			let tempResult = null;

			try
			{
				tempResult = await TILES_DYNAMIC_IN_FLIGHT;
			}
			finally
			{
				TILES_DYNAMIC_IN_FLIGHT = null;
			}

			tempNow = Date.now();
			const tempSeconds = TILES_DYNAMIC_CACHE.expiresAt && tempNow < TILES_DYNAMIC_CACHE.expiresAt ? Math.max( 0, Math.floor( ( TILES_DYNAMIC_CACHE.expiresAt - tempNow ) / 1000 ) ) : 0;

			tResponse.setHeader( "Cache-Control", `private, max-age=${tempSeconds}` );
			tResponse.setHeader( "X-Cache", "MISS" );

			return tResponse.json( tempResult );
		}
		catch ( tError )
		{
			console.error( "Error in /api/tiles/dynamic:", tError );

			TILES_DYNAMIC_IN_FLIGHT = null;
		}

		return tResponse.status( 500 ).json( { error: "Internal server error" } );
	}
);

APP.get(
	"/api/tiles",
	( _, tResponse ) =>
	{
		return tResponse.json( TILES );
	}
);

APP.get(
	"/api/gunTypes",
	( _, tResponse ) =>
	{
		return tResponse.json( GUN_TYPES );
	}
);

// SPA
APP.use( express.static( path.join( __dirname, "dist" ) ) );

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
		console.log( `Server running on http://0.0.0.0:${PORT}` );
	}
);
