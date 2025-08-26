export default class GunType
{
	public readonly name: string;
	public readonly rangeMin: number;
	public readonly rangeMax: number;
	public readonly inaccuracyMin: number;
	public readonly inaccuracyMax: number;
	public readonly windEffect: number;
	constructor( tName: string, tRangeMin: number, tRangeMax: number, tInaccuracyMin: number, tInaccuracyMax: number, tWindEffect: number )
	{
		this.name = tName;
		this.rangeMin = tRangeMin;
		this.rangeMax = tRangeMax;
		this.inaccuracyMin = tInaccuracyMin;
		this.inaccuracyMax = tInaccuracyMax;
		this.windEffect = tWindEffect;
	}
}
