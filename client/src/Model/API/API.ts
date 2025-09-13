import type Tile from "./Tile";

export default class Service
{
	protected _URL: string;
	protected _defaultHeaders: HeadersInit = { "Content-Type": "application/json" };
	
	constructor( tURL: string )
	{
		this._URL = tURL;
	}
	
	// Generic
	protected async GetAsync<T>( tPath: string ): Promise<T | null>
	{
		try
		{
			const tempResponse = await fetch( `${this._URL}${tPath}` );
			if ( tempResponse.ok )
			{
				return await tempResponse.json() as T;
			}
		}
		catch ( tError )
		{
			console.error( "Error:", tError );
		}
		
		return null;
	}

	public async GetTileAsync( tKey: string ): Promise<Tile | null>
	{
		return this.GetAsync( `/worldconquest/maps/${tKey}/dynamic/public/` );
	}
}
