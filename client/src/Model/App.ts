import { makeObservable, observable, action, reaction, comparer } from "mobx";
import FireGroup from "./FireControl/FireGroup";
import GunType from "./FireControl/GunType";
import type { Snapshot as FireGroupSnapshot } from "./FireControl/FireGroup";
import Tile from "./Map/Tile";

const STORAGE_KEY = "foxhole-artillery:app";

export type Snapshot =
{
	fireGroups: FireGroupSnapshot[];
}

export default class App
{
	public readonly tiles: Tile[];
	public readonly gunTypes: GunType[];
	public readonly fireGroups: FireGroup[] = [];
	protected _disposeAutosave?: () => void;


	constructor()
	{
		makeObservable(
			this,
			{
				fireGroups: observable.shallow,
				AddFireGroup: action,
				RemoveFireGroup: action,
				Dispose: action,
				Load: action
			}
		);

		// Gun Types
		this.gunTypes =
		[
			new GunType( "Cremari Mortar", 45, 80, 5.5, 12, 10 ),
			new GunType( "120mm Huber Lariat", 100, 300, 25, 35, 10 ),
			new GunType( "150mm Huber Exalt", 100, 300, 25, 35, 10 ),
			new GunType( "300mm Storm Cannon", 400, 1000, 50, 50, 50 )
		];

		// Tiles
		this.tiles =
		[
			new Tile( "Oarbreak Isles", "OarbreakerHex", -4, 1 ),
			new Tile( "Fisherman's Row", "FishermansRowHex", -4, 2 ),
			new Tile( "Stema Landing", "StemaLandingHex", -4, 3 ),

			new Tile( "Nevish Line", "NevishLineHex", -3, 0 ),
			new Tile( "Farranac Coast", "FarranacCoastHex", -3, 1 ),
			new Tile( "Westgate", "WestgateHex", -3, 2 ),
			new Tile( "Origin", "OriginHex", -3, 3 ),

			new Tile( "Callum's Cape", "CallumsCapeHex", -2, -1 ),
			new Tile( "Stonecradle", "StonecradleHex", -2, 0 ),
			new Tile( "King's Cage", "KingsCageHex", -2, 1 ),
			new Tile( "Sableport", "SableportHex", -2, 2 ),
			new Tile( "Ash Fields", "AshFieldsHex", -2, 3 ),

			new Tile( "Speaking Woods", "SpeakingWoodsHex", -1, -2 ),
			new Tile( "The Moors", "MooringCountyHex", -1, -1 ),
			new Tile( "The Linn of Mercy", "LinnMercyHex", -1, 0 ),
			new Tile( "Loch Mor", "LochMorHex", -1, 1 ),
			new Tile( "The Heartlands", "HeartlandsHex", -1, 2 ),
			new Tile( "Red River", "RedRiverHex", -1, 3 ),

			new Tile( "Basin Sionnach", "BasinSionnachHex", 0, -3 ),
			new Tile( "Reaching Trail", "ReachingTrailHex", 0, -2 ),
			new Tile( "Callahan's Passage", "CallahansPassageHex", 0, -1 ),
			new Tile( "Deadlands", "DeadLandsHex", 0, 0 ),
			new Tile( "Umbral Wildwood", "UmbralWildwoodHex", 0, 1 ),
			new Tile( "Great March", "GreatMarchHex", 0, 2 ),
			new Tile( "Kalokai", "KalokaiHex", 0, 3 ),

			new Tile( "Howl County", "HowlCountyHex", 1, -3 ),
			new Tile( "Viper Pit", "ViperPitHex", 1, -2 ),
			new Tile( "Marban Hollow", "MarbanHollow", 1, -1 ),
			new Tile( "The Drowned Vale", "DrownedValeHex", 1, 0 ),
			new Tile( "Shackled Chasm", "ShackledChasmHex", 1, 1 ),
			new Tile( "Acrithia", "AcrithiaHex", 1, 2 ),

			new Tile( "Clanshead Valley", "ClansheadValleyHex", 2, -3 ),
			new Tile( "Weathered Expanse", "WeatheredExpanseHex", 2, -2 ),
			new Tile( "The Clahstra", "ClahstraHex", 2, -1 ),
			new Tile( "Allod's Bight", "AllodsBightHex", 2, 0 ),
			new Tile( "Terminus", "TerminusHex", 2, 1 ),

			new Tile( "Morgen's Crossing", "MorgensCrossingHex", 2, -3 ),
			new Tile( "Stlican Shelf", "StlicanShelfHex", 2, -2 ),
			new Tile( "Endless Shore", "EndlessShoreHex", 2, -1 ),
			new Tile( "Reaver's Pass", "ReaversPassHex", 2, 0 ),

			new Tile( "Godcrofts", "GodcroftsHex", 3, -3 ),
			new Tile( "Tempest Island", "TempestIslandHex", 3, -2 ),
			new Tile( "The Fingers", "TheFingersHex", 3, -1 )
		];

		// Load
		this.Load();

		// Autosaving
		this._disposeAutosave = reaction(
			() => this.Snapshot,
			( x ) => this.Save( x ),
			{ delay: 300, equals: comparer.structural }
		);
	}

	public AddFireGroup()
	{
		this.fireGroups.push( new FireGroup( `Fire Group ${this.fireGroups.length + 1}` ) );
	}

	public RemoveFireGroup( tIndex: number )
	{
		const [ tempFireGroup ] = this.fireGroups.splice( tIndex, 1 );
		tempFireGroup?.Dispose?.();
	}

	public Dispose()
	{
		this._disposeAutosave?.();

		this.fireGroups.forEach( x => x.Dispose?.() );
		this.fireGroups.length = 0;
	}

	public get Snapshot(): Snapshot
	{
		return {
			fireGroups: this.fireGroups.flatMap( x => x.Snapshot )
		};
	}

	public Save( tSnapshot: Snapshot )
	{
		window.localStorage.setItem( STORAGE_KEY, JSON.stringify( tSnapshot ) );
	}

	public Load()
	{
		const tempRaw = window.localStorage.getItem( STORAGE_KEY );
		if ( tempRaw != null )
		{
			const tempSnapshot = JSON.parse( tempRaw ) as Snapshot;

			// Fire Groups
			this.fireGroups.length = 0;
			const tempFireGroupsLength = tempSnapshot.fireGroups.length;

			for ( let i = 0; i < tempFireGroupsLength; ++i )
			{
				const tempFireGroupSnapshot = tempSnapshot.fireGroups[ i ];
				const tempFireGroup = new FireGroup( tempFireGroupSnapshot.name );
				tempFireGroup.Load( tempSnapshot.fireGroups[ i ], this.gunTypes );
				this.fireGroups.push( tempFireGroup );
			}
		}
	}
}
