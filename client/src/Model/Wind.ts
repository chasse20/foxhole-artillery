import { makeObservable, observable, computed, runInAction } from "mobx";

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
				Angle: computed
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
}
