import type GunType from "./GunType";
import type Tile from "./Tile";
import type DynamicTile from "./DynamicTile";

export default class API
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

	public async GetGunTypesAsync(): Promise<GunType[] | null>
	{
		return this.GetAsync( `/api/gunTypes` );
	}

	public async GetTilesAsync(): Promise<Tile[] | null>
	{
		return this.GetAsync( `/api/tiles` );
	}

	private IsDynamicTileOkay( tDynamicTile: DynamicTile )
	{
		return tDynamicTile && typeof tDynamicTile === "object" && !( "error" in tDynamicTile );
	}

	public async GetDynamicTilesAsync(): Promise<Map<string, DynamicTile> | null>
	{
		const tempRaw = this.GetAsync( `/api/tiles/dynamic` );
		return tempRaw == null ? null : new Map<string, DynamicTile>( Object.entries( tempRaw ).filter( ( [ _, value ] ) => this.IsDynamicTileOkay( value ) ) as [ string, DynamicTile ][] );
	}
}
