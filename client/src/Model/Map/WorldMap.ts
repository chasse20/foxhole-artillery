import { computed, makeObservable, observable, runInAction, action } from "mobx";
import Axial from "../Axial";
import Rectangle from "../Rectangle";
import Tile from "./Tile";
import type { Snapshot as TileSnapshot } from "./Tile";
import type { Snapshot as WorldBindSnapshot } from "./WorldBind";
import API from "../API/API";
import WorldBind from "./WorldBind";

export type Snapshot =
{
	x: number;
	y: number;
	zoom: number;
	tiles: TileSnapshot[];
	baseWorldBind: WorldBindSnapshot;
	spotterWorldBind: WorldBindSnapshot;
};

export default class WorldMap
{
	protected _x: number = 0;
	protected _y: number = 0;
	protected _zoom: number = 0;
	public readonly tiles: Tile[];
	public readonly baseWorldBind: WorldBind = new WorldBind();
	public readonly spotterWorldBind: WorldBind = new WorldBind();

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
				baseWorldBind: observable,
				spotterWorldBind: observable,
				Load: action
			}
		);

		// Tiles
		const tempRadius = 512;

		this.tiles =
		[
			new Tile( "Oarbreak Isles", "OarbreakerHex", new Axial( -4, 1 ), tempRadius ),
			new Tile( "Fisherman's Row", "FishermansRowHex", new Axial( -4, 2 ), tempRadius ),
			new Tile( "Stema Landing", "StemaLandingHex", new Axial( -4, 3 ), tempRadius ),

			new Tile( "Nevish Line", "NevishLineHex", new Axial( -3, 0 ), tempRadius ),
			new Tile( "Farranac Coast", "FarranacCoastHex", new Axial( -3, 1 ), tempRadius ),
			new Tile( "Westgate", "WestgateHex", new Axial( -3, 2 ), tempRadius ),
			new Tile( "Origin", "OriginHex", new Axial( -3, 3 ), tempRadius ),

			new Tile( "Callum's Cape", "CallumsCapeHex", new Axial( -2, -1 ), tempRadius ),
			new Tile( "Stonecradle", "StonecradleHex", new Axial( -2, 0 ), tempRadius ),
			new Tile( "King's Cage", "KingsCageHex", new Axial( -2, 1 ), tempRadius ),
			new Tile( "Sableport", "SableportHex", new Axial( -2, 2 ), tempRadius ),
			new Tile( "Ash Fields", "AshFieldsHex", new Axial( -2, 3 ), tempRadius ),

			new Tile( "Speaking Woods", "SpeakingWoodsHex", new Axial( -1, -2  ), tempRadius ),
			new Tile( "The Moors", "MooringCountyHex", new Axial( -1, -1 ), tempRadius ),
			new Tile( "The Linn of Mercy", "LinnMercyHex", new Axial( -1, 0 ), tempRadius ),
			new Tile( "Loch Mor", "LochMorHex", new Axial( -1, 1 ), tempRadius ),
			new Tile( "The Heartlands", "HeartlandsHex", new Axial( -1, 2 ), tempRadius ),
			new Tile( "Red River", "RedRiverHex", new Axial( -1, 3 ), tempRadius ),

			new Tile( "Basin Sionnach", "BasinSionnachHex", new Axial( 0, -3 ), tempRadius ),
			new Tile( "Reaching Trail", "ReachingTrailHex", new Axial( 0, -2 ), tempRadius ),
			new Tile( "Callahan's Passage", "CallahansPassageHex", new Axial( 0, -1 ), tempRadius ),
			new Tile( "Deadlands", "DeadLandsHex", new Axial( 0, 0 ), tempRadius ),
			new Tile( "Umbral Wildwood", "UmbralWildwoodHex", new Axial( 0, 1 ), tempRadius ),
			new Tile( "Great March", "GreatMarchHex", new Axial( 0, 2 ), tempRadius ),
			new Tile( "Kalokai", "KalokaiHex", new Axial( 0, 3 ), tempRadius ),

			new Tile( "Howl County", "HowlCountyHex", new Axial( 1, -3 ), tempRadius ),
			new Tile( "Viper Pit", "ViperPitHex", new Axial( 1, -2 ), tempRadius ),
			new Tile( "Marban Hollow", "MarbanHollow", new Axial( 1, -1 ), tempRadius ),
			new Tile( "The Drowned Vale", "DrownedValeHex", new Axial( 1, 0 ), tempRadius ),
			new Tile( "Shackled Chasm", "ShackledChasmHex", new Axial( 1, 1 ), tempRadius ),
			new Tile( "Acrithia", "AcrithiaHex", new Axial( 1, 2 ), tempRadius ),

			new Tile( "Clanshead Valley", "ClansheadValleyHex", new Axial( 2, -3 ), tempRadius ),
			new Tile( "Weathered Expanse", "WeatheredExpanseHex", new Axial( 2, -2 ), tempRadius ),
			new Tile( "The Clahstra", "ClahstraHex", new Axial( 2, -1 ), tempRadius ),
			new Tile( "Allod's Bight", "AllodsBightHex", new Axial( 2, 0 ), tempRadius ),
			new Tile( "Terminus", "TerminusHex", new Axial( 2, 1 ), tempRadius ),

			new Tile( "Morgen's Crossing", "MorgensCrossingHex", new Axial( 3, -3 ), tempRadius ),
			new Tile( "Stlican Shelf", "StlicanShelfHex", new Axial( 3, -2 ), tempRadius ),
			new Tile( "Endless Shore", "EndlessShoreHex", new Axial( 3, -1 ), tempRadius ),
			new Tile( "Reaver's Pass", "ReaversPassHex", new Axial( 3, 0 ), tempRadius ),

			new Tile( "Godcrofts", "GodcroftsHex", new Axial( 4, -3 ), tempRadius ),
			new Tile( "Tempest Island", "TempestIslandHex", new Axial( 4, -2 ), tempRadius ),
			new Tile( "The Fingers", "TheFingersHex", new Axial( 4, -1 ), tempRadius )
		];
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
			zoom: this._zoom,
			tiles: this.tiles.flatMap( x => x.Snapshot ),
			baseWorldBind: this.baseWorldBind.Snapshot,
			spotterWorldBind: this.spotterWorldBind.Snapshot
		};
	}

	public Load( tSnapshot: Snapshot )
	{
		this._x = tSnapshot.x;
		this._y = tSnapshot.y;
		this._zoom = tSnapshot.zoom;

		// Tiles
		if ( tSnapshot.tiles != null )
		{
			const tempListLength = tSnapshot.tiles.length;

			for ( let i = 0; i < tempListLength; ++i )
			{
				this.tiles[ i ].Load( tSnapshot.tiles[ i ] );
			}
		}

		// World Binds
		if ( tSnapshot.baseWorldBind != null )
		{
			this.baseWorldBind.Load( tSnapshot.baseWorldBind, this.tiles );
		}

		if ( tSnapshot.spotterWorldBind != null )
		{
			this.spotterWorldBind.Load( tSnapshot.spotterWorldBind, this.tiles );
		}
	}

	public async UpdateAsync( tAPI: API )
	{
		const tempTileTasks = [];

		for ( let i = this.tiles.length - 1; i >= 0; --i )
		{
			tempTileTasks.push( this.tiles[ i ].UpdateAsync( tAPI ) );
		}

		await Promise.all( tempTileTasks );
	}
}
