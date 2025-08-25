import { makeObservable, observable } from "mobx";
import type WindStrength from "./WindStrength";

export default class Wind
{
	public strength: WindStrength;
	public angle: number = 0;

	constructor( tStrength: WindStrength )
	{
		makeObservable(
			this,
			{
				strength: observable,
				angle: observable
			}
		);

		this.strength = tStrength;
	}
}
