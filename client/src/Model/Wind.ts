import { makeObservable, observable, computed, runInAction } from "mobx";
import type WindStrength from "./WindStrength";

export default class Wind
{
	protected _strength: WindStrength;
	protected _angle: number = 0;

	constructor( tStrength: WindStrength )
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

		this._strength = tStrength;
	}

	public get Strength()
	{
		return this._strength;
	}

	public set Strength( tValue: WindStrength )
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
