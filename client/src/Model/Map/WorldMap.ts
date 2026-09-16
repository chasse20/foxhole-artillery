import { computed, makeObservable, observable, runInAction, action } from "mobx";
import Axial from "../Axial";
import Rectangle from "../Rectangle";
import Tile from "./Tile";
import API from "../API/API";
import APITile from "../API/Tile";
import APIDynamicTile from "../API/DynamicTile";

export type Snapshot =
{
	x: number;
	y: number;
	zoom: number;
};

export default class WorldMap
{
	protected _x: number = 0;
	protected _y: number = 0;
	protected _zoom: number = 0;
	public readonly tiles: Tile[] = [];

	constructor()
	{
		makeObservable<WorldMap, "_x" | "_y" | "_zoom">(
			this,
			{
				_x: observable,
				X: computed,
				_y: observable,
				Y: computed,
				_zoom: observable,
				Zoom: computed,
				Load: action
			}
		);
	}

	public get X()
	{
		return this._x;
	}

	public set X( tValue: number )
	{
		runInAction( () => { this._x = tValue; } )
	}

	public get Y()
	{
		return this._y;
	}

	public set Y( tValue: number )
	{
		runInAction( () => { this._y = tValue; } )
	}

	public get Zoom()
	{
		return this._zoom;
	}

	public set Zoom( tValue: number )
	{
		runInAction( () => { this._zoom = tValue; } )
	}

	public get WorldBounds(): Rectangle
	{
		let tempMinX = Infinity;
		let tempMaxX = -Infinity;
		let tempMinY = Infinity;
		let tempMaxY = -Infinity;

		for ( let i = this.tiles.length - 1; i >= 0; --i )
		{
			const tempTile = this.tiles[ i ];

			if ( tempTile.rectangle.left < tempMinX )
			{
				tempMinX = tempTile.rectangle.left;
			}

			if ( tempTile.rectangle.right > tempMaxX )
			{
				tempMaxX = tempTile.rectangle.right;
			}

			if ( tempTile.rectangle.top < tempMinY )
			{
				tempMinY = tempTile.rectangle.top;
			}

			if ( tempTile.rectangle.bottom > tempMaxY )
			{
				tempMaxY = tempTile.rectangle.bottom;
			}
		}

		return new Rectangle( tempMinX, tempMinY, tempMaxX, tempMaxY );
	}

	public get Snapshot(): Snapshot
	{
		return {
			x: this._x,
			y: this._y,
			zoom: this._zoom
		};
	}

	public Load( tSnapshot: Snapshot | null, tTiles: APITile[] | null, tDynamicTiles: Map<string, APIDynamicTile> | null )
	{
		// Snapshot
		if ( tSnapshot != null )
		{
			this._x = tSnapshot.x;
			this._y = tSnapshot.y;
			this._zoom = tSnapshot.zoom;
		}

		// Tiles
		if ( tTiles != null )
		{
			const tempRadius = 512;
			const tempTilesLength = tTiles.length;

			for ( let i = 0; i < tempTilesLength; ++i )
			{
				const tempAPITile = tTiles[ i ];
				const tempTile = new Tile( tempAPITile.name ?? "", tempAPITile.key ?? "", new Axial( tempAPITile.position?.q ?? 0, tempAPITile.position?.r ?? 0 ), tempRadius );
				tempTile.Load( tDynamicTiles?.get( tempTile.key ) ?? null );
				
				this.tiles.push( tempTile );
			}
		}
	}

	public async UpdateAsync( tAPI: API )
	{
		const tempDynamicTiles = await tAPI.GetDynamicTilesAsync();

		if ( tempDynamicTiles != null )
		{
			for ( let i = this.tiles.length - 1; i >= 0; --i )
			{
				const tempTile = this.tiles[ i ];
				this.tiles[ i ].Update( tempDynamicTiles?.get( tempTile.key ) ?? null );
			}
		}
	}
}
