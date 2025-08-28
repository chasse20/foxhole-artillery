export default class Tile
{
	public readonly q: number;
	public readonly r: number;
	public readonly name: string;
	public readonly key: string;

	constructor( tName: string, tKey: string, tQ: number, tR: number )
	{
		this.name = tName;
		this.key = tKey;
		this.q = tQ;
		this.r = tR;
	}
}
