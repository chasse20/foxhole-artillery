import { makeObservable, observable, computed, runInAction, action } from "mobx";
import PolarCoordinate from "../PolarCoordinate";
import type { Snapshot as PolarCoordinateSnapshot } from "../PolarCoordinate";
import type GunType from "./GunType";

export type Snapshot =
{
	location: PolarCoordinateSnapshot;
	name: string;
	type: string;
};

export default class Gun
{
	public readonly location: PolarCoordinate = new PolarCoordinate();
	public readonly aim: PolarCoordinate = new PolarCoordinate(); // updated by FireGroup->Calculate()
	protected _name: string = "Gun"
	protected _type: GunType;
	protected _aimRadius: number = 0;

	constructor( tName: string, tType: GunType )
	{
		makeObservable<Gun, "_name" | "_type" | "_aimRadius">(
			this,
			{
				location: observable,
				aim: observable,
				_name: observable,
				Name: computed,
				_type: observable,
				Type: computed,
				_aimRadius: observable,
				AimRadius: computed,
				Load: action
			}
		);

		this._name = tName;
		this._type = tType;
	}

	public get MessageText()
	{
		const tempName = ( this.Name ?? "" ).trim() || "Gun";
		return `((${tempName})) ${Math.round(this.aim.Distance)}m, ${this.aim.Angle.toFixed(1)}\u00B0`;
	}

	public get Name()
	{
		return this._name;
	}

	public set Name( tValue: string )
	{
		runInAction( () => { this._name = tValue; } )
	}

	public get Type()
	{
		return this._type;
	}

	public set Type( tValue: GunType )
	{
		runInAction( () => { this._type = tValue; } )
	}

	public get AimRadius()
	{
		return this._aimRadius;
	}

	public set AimRadius( tValue: number )
	{
		runInAction( () => { this._aimRadius = tValue; } )
	}

	public get Snapshot(): Snapshot
	{
		return {
			location: this.location.Snapshot,
			name: this._name,
			type: this._type.name
		};
	}

	public Load( tSnapshot: Snapshot )
	{
		this.location.Load( tSnapshot.location );
	}
}
