export default class WindStrength
{
	public readonly name: string;
	public readonly along: number;
	public readonly cross: number;

	constructor( tName: string, tAlong: number, tCross: number )
	{
		this.name = tName;
		this.along = tAlong;
		this.cross = tCross;
	}
}
