import { makeObservable, observable } from "mobx";
import PolarCoordinate from "./PolarCoordinate";
import type GunType from "./GunType";

export default class Gun
{
	public readonly location: PolarCoordinate = new PolarCoordinate();
	public readonly target: PolarCoordinate = new PolarCoordinate(); // updated by FireGroup->Calculate()
	public targetRadius: number = 0;
	public type: GunType;

	constructor( tType: GunType )
	{
		makeObservable(
			this,
			{
				location: observable,
				type: observable,
				target: observable,
				targetRadius: observable
			}
		);

		this.type = tType;
	}
}
