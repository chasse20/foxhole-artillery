import { makeObservable, observable, action, reaction, comparer } from "mobx";
import FireGroup from "./FireGroup";
import GunType from "./GunType";
import type { Snapshot as FireGroupSnapshot } from "./FireGroup";

const STORAGE_KEY = "foxhole-artillery:app";

export type Snapshot =
{
	fireGroups: FireGroupSnapshot[];
}

export default class App
{
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

		this.gunTypes =
		[
			new GunType( "Cremari Mortar", 45, 80, 5.5, 12, 5 ),
			new GunType( "120mm Huber Lariat", 100, 300, 25, 35, 10 ),
			new GunType( "150mm Huber Exalt", 100, 300, 25, 35, 10 ),
			new GunType( "300mm Storm Cannon", 400, 1000, 50, 50, 50 )
		];

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
