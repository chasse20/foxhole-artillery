import { computed, makeObservable, observable, runInAction, action } from "mobx";
import PolarCoordinate from "../PolarCoordinate";
import type { Snapshot as PolarCoordinateSnapshot } from "../PolarCoordinate";
import type Icon from "./Icon";
import type Tile from "./Tile";

export type Snapshot =
{
	coordinate: PolarCoordinateSnapshot;
	iconWorldX: number;
	iconWorldY: number;
};

export default class WorldBind
{
	public readonly coordinate: PolarCoordinate = new PolarCoordinate();
	protected _icon: Icon | null = null;

	constructor()
	{
		makeObservable<WorldBind, "_icon">(
			this,
			{
				coordinate: observable,
				_icon: observable,
				Icon: computed,
				Load: action
			}
		);
	}

	public get Icon()
	{
		return this._icon;
	}

	public set Icon( tValue: Icon | null )
	{
		 runInAction( () => { this._icon = tValue; } )
	}

	public get Snapshot(): Snapshot
	{
		return {
			coordinate: this.coordinate.Snapshot,
			iconWorldX: this._icon?.worldPosition.x ?? Number.MIN_SAFE_INTEGER,
			iconWorldY: this._icon?.worldPosition.y ?? Number.MIN_SAFE_INTEGER
		};
	}

	public Load( tSnapshot: Snapshot, tTiles: Tile[] )
	{
		this.coordinate.Load( tSnapshot.coordinate );

		// Find icon
		if ( tSnapshot.iconWorldX != Number.MIN_SAFE_INTEGER )
		{
			for ( let i = tTiles.length - 1; i >= 0; --i )
			{
				const tempTile = tTiles[ i ];

				for ( let j = tempTile.icons.length - 1; j >= 0; --j )
				{
					const tempIcon = tempTile.icons[ j ];

					if ( tempIcon.worldPosition.x == tSnapshot.iconWorldX && tempIcon.worldPosition.y == tSnapshot.iconWorldY )
					{
						this._icon = tempIcon;
					}
				}
			}
		}
	}
}
