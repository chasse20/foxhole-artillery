import { makeObservable, observable, action, reaction, comparer, computed } from "mobx";
import FireGroup from "./FireControl/FireGroup";
import GunType from "./FireControl/GunType";
import type { Snapshot as MapSnapshot } from "./Map/WorldMap";
import type { Snapshot as FireGroupSnapshot } from "./FireControl/FireGroup";
import WorldMap from "./Map/WorldMap";
import API from "./API/API";
import type Icon from "./Map/Icon";

const STORAGE_KEY = "foxhole-artillery:app";

export type Snapshot =
{
	map: MapSnapshot;
	fireGroups: FireGroupSnapshot[];
}

export default class App
{
	public readonly API: API = new API( "https://war-service-live.foxholeservices.com/api" );
	public readonly map: WorldMap = new WorldMap();
	public readonly gunTypes: GunType[];
	public readonly fireGroups: FireGroup[] = [];
	protected _disposeAutosave?: () => void;


	constructor()
	{
		makeObservable(
			this,
			{
				map: observable,
				fireGroups: observable.shallow,
				AddFireGroup: action,
				RemoveFireGroup: action,
				IsSelectingMapIcon: computed,
				OnMapIconSelect: action,
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
			new GunType( "150mm Flood Mk. IX Stain", 120, 250, 25, 35, 10 ),
			new GunType( "300mm Storm Cannon", 400, 1000, 50, 50, 50 ),
			new GunType( "3C Squire", 375, 500, 39, 51, 10 ),
			new GunType( "4C Wasp Nest", 375, 450, 37.5, 60, 10 ),
			new GunType( "4C Skycaller", 275, 350, 37.5, 60, 10 ),
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

	public get IsSelectingMapIcon()
	{
		for ( let i = this.fireGroups.length - 1; i >= 0; --i )
		{
			if ( this.fireGroups[ i ].IsSelectingMapIcon )
			{
				return true;
			}
		}

		return false;
	}

	public OnMapIconSelect( tIcon: Icon )
	{
		console.log( tIcon.worldPosition );

		for ( let i = this.fireGroups.length - 1; i >= 0; --i )
		{
			this.fireGroups[ i ].OnMapIconSelect( tIcon );	
		}
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
			map: this.map.Snapshot,
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

			// Map
			this.map.Load( tempSnapshot.map );

			// Fire Groups
			this.fireGroups.length = 0;
			const tempFireGroupsLength = tempSnapshot.fireGroups.length;

			for ( let i = 0; i < tempFireGroupsLength; ++i )
			{
				const tempFireGroupSnapshot = tempSnapshot.fireGroups[ i ];
				const tempFireGroup = new FireGroup( tempFireGroupSnapshot.name );
				tempFireGroup.Load( tempSnapshot.fireGroups[ i ], this.gunTypes, this.map.tiles );
				this.fireGroups.push( tempFireGroup );
			}
		}
	}

	public async UpdateAsync()
	{
		await this.map.UpdateAsync( this.API );
	}
}
