import { makeObservable, observable, computed, runInAction, action } from "mobx";

export type Snapshot =
{
	strength: number;
	angle: number;
};

export default class Wind
{
	protected _strength: number = 1;
	protected _angle: number = 0;

	constructor()
	{
		makeObservable<Wind, "_strength" | "_angle">(
			this,
			{
				_strength: observable,
				Strength: computed,
				_angle: observable,
				Angle: computed,
				Load: action
			}
		);
	}

	public get Strength()
	{
		return this._strength;
	}

	public set Strength( tValue: number )
	{
		runInAction( () => { this._strength = tValue; } )
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
			strength: this._strength,
			angle: this._angle
		};
	}

	public Load( tSnapshot: Snapshot )
	{
		this._strength = tSnapshot.strength;
		this._angle = tSnapshot.angle;
	}
}
