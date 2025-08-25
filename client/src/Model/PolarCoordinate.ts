import { makeObservable, observable } from "mobx";

export default class PolarCoordinate
{
	public distance: number = 0;
	public angle: number = 0;

	constructor()
	{
		makeObservable(
			this,
			{
				distance: observable,
				angle: observable
			}
		);
	}
}
