import { makeObservable, observable, computed, runInAction } from "mobx";
import PolarCoordinate from "./PolarCoordinate";
import type GunType from "./GunType";

export default class Gun
{
	public readonly location: PolarCoordinate = new PolarCoordinate( 0, 0 );
	public readonly aim: PolarCoordinate = new PolarCoordinate( 0, 0 ); // updated by FireGroup->Calculate()
	protected _name: string = "Gun"
	protected _type: GunType;
	protected _aimRadius: number = 0;

	constructor( tType: GunType )
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
				AimRadius: computed
			}
		);

		this._type = tType;
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
}
