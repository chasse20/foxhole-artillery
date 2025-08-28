import { makeObservable, observable, computed, runInAction, action } from "mobx";

export type Snapshot =
{
	distance: number;
	angle: number;
};

export default class PolarCoordinate
{
	protected _distance: number = 0;
	protected _angle: number = 0;

	constructor()
	{
		makeObservable<PolarCoordinate, "_distance" | "_angle">(
			this,
			{
				_distance: observable,
				Distance: computed,
				_angle: observable,
				Angle: computed,
				Load: action
			}
		);
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

	public get Snapshot(): Snapshot
	{
		return {
			distance: this._distance,
			angle: this._angle,
		};
	}

	public Load( tSnapshot: Snapshot )
	{
		this._distance = tSnapshot.distance;
		this._angle = tSnapshot.angle;
	}
}
