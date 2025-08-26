import { computed, makeObservable, observable, runInAction } from "mobx";
import PolarCoordinate from "./PolarCoordinate";

export default class Target
{
	public readonly coordinate: PolarCoordinate = new PolarCoordinate( 0, 0 );
	protected _name: string = "Target"

	constructor()
	{
		makeObservable<Target, "_name">(
			this,
			{
				coordinate: observable,
				_name: observable,
				Name: computed
			}
		);
	}

	public get Name()
	{
		return this._name;
	}

	public set Name( tValue: string )
	{
		 runInAction( () => { this._name = tValue; } )
	}
}
