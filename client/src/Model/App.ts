import { makeObservable, observable, action, reaction, comparer, computed } from "mobx";
import FireGroup from "./FireControl/FireGroup";
import GunType from "./FireControl/GunType";
import APIGunType from "./API/GunType";
import APITile from "./API/Tile";
import APIDynamicTile from "./API/DynamicTile";
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
	public readonly API: API = new API( "" );
	public readonly map: WorldMap = new WorldMap();
	public readonly gunTypes: GunType[] = [];
	public readonly fireGroups: FireGroup[] = [];
	protected _disposeAutosave?: () => void;
	protected _isLoaded = false;

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

		// Autosaving
		this._disposeAutosave = reaction(
			() => this.Snapshot,
			( x ) => this.Save( x ),
			{ delay: 300, equals: comparer.structural }
		);

		// Load
		void this.LoadAsync();
	}

	protected async LoadAsync()
	{
		const tempResults = await Promise.all(
			[
				this.API.GetGunTypesAsync(),
				this.API.GetTilesAsync(),
				this.API.GetDynamicTilesAsync()
			]
		);

		this.Load( tempResults[ 0 ], tempResults[ 1 ], tempResults[ 2 ] );
	}

	public Load( tGunTypes: APIGunType[] | null, tTiles: APITile[] | null, tDynamicTiles: Map<string, APIDynamicTile> | null )
	{
		if ( !this._isLoaded )
		{
			this._isLoaded = true;

			// API Gun Types
			if ( tGunTypes != null )
			{
				const tempGunTypesLength = tGunTypes.length;

				for ( let i = 0; i < tempGunTypesLength; ++i )
				{
					const tempAPIGunType = tGunTypes[ i ];
					this.gunTypes.push( new GunType( tempAPIGunType.name ?? "", tempAPIGunType.rangeMin ?? 0, tempAPIGunType.rangeMax ?? 0, tempAPIGunType.inaccuracyMin ?? 0, tempAPIGunType.inaccuracyMax ?? 0, tempAPIGunType.windEffect ?? 0 ) );
				}
			}

			// Storage
			const tempRaw = window.localStorage.getItem( STORAGE_KEY );
			const tempSnapshot = tempRaw == null ? null : JSON.parse( tempRaw ) as Snapshot;

			// Map
			this.map.Load( tempSnapshot?.map ?? null, tTiles, tDynamicTiles );

			// Fire Groups (give some default starters if no snapshot)
			if ( tempSnapshot == null )
			{
				const tempFireGroup = new FireGroup( "Fire Group 1" );
				tempFireGroup.wind.Strength = 3;
				tempFireGroup.AddGun( this.gunTypes[ 1 ] );
				tempFireGroup.guns[ 0 ].Name = "Battery A";
				tempFireGroup.AddTarget();
				tempFireGroup.targets[ 0 ].Name = "Bridge";
				this.fireGroups.push( tempFireGroup );
			}
			else
			{
				this.fireGroups.length = 0;
				const tempFireGroupsLength = tempSnapshot.fireGroups.length;
				const tempGunTypes = new Map<string, GunType>( this.gunTypes.map( x => [ x.name, x ] ) );

				for ( let i = 0; i < tempFireGroupsLength; ++i )
				{
					const tempFireGroupSnapshot = tempSnapshot.fireGroups[ i ];
					const tempFireGroup = new FireGroup( tempFireGroupSnapshot.name );
					tempFireGroup.Load( tempSnapshot.fireGroups[ i ], tempGunTypes, this.map.tiles );
					this.fireGroups.push( tempFireGroup );
				}
			}
		}
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

	public async UpdateAsync()
	{
		await this.map.UpdateAsync( this.API );
	}
}
