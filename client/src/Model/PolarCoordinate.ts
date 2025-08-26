import { makeObservable, observable, computed, runInAction } from "mobx";

export default class PolarCoordinate
{
	protected _distance: number;
	protected _angle: number;

	constructor( tDistance: number, tAngle: number )
	{
		makeObservable<PolarCoordinate, "_distance" | "_angle">(
			this,
			{
				_distance: observable,
				Distance: computed,
				_angle: observable,
				Angle: computed
			}
		);

		this._distance = tDistance;
		this._angle = tAngle;
	}

	public get Distance()
	{
		return this._distance;
	}

	public set Distance( tValue: number )
	{
		runInAction( () => { this._distance = tValue; } )
	}

	public get Angle()
	{
		return this._angle;
	}

	public set Angle( tValue: number )
	{
		runInAction( () => { this._angle = tValue; } )
	}
}
