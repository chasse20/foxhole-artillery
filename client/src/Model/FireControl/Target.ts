import { computed, makeObservable, observable, runInAction, action } from "mobx";
import PolarCoordinate from "../PolarCoordinate";
import type { Snapshot as PolarCoordinateSnapshot } from "../PolarCoordinate";

export type Snapshot =
{
	coordinate: PolarCoordinateSnapshot;
	name: string;
};

export default class Target
{
	public readonly coordinate: PolarCoordinate = new PolarCoordinate();
	protected _name: string = "Target"

	constructor( tName: string )
	{
		makeObservable<Target, "_name">(
			this,
			{
				coordinate: observable,
				_name: observable,
				Name: computed,
				Load: action
			}
		);

		this._name = tName;
	}

	public get Name()
	{
		return this._name;
	}

	public set Name( tValue: string )
	{
		runInAction( () => { this._name = tValue; } )
	}

	public get Snapshot(): Snapshot
	{
		return {
			coordinate: this.coordinate.Snapshot,
			name: this._name,
		};
	}

	public Load( tSnapshot: Snapshot )
	{
		this.coordinate.Load( tSnapshot.coordinate );
	}
}
