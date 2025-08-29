export default class Rectangle
{
	public readonly left: number;
	public readonly top: number;
	public readonly right: number;
	public readonly bottom: number;

	constructor( tLeft: number, tTop: number, tRight: number, tBottom: number )
	{
		this.left = tLeft;
		this.top = tTop;
		this.right = tRight;
		this.bottom = tBottom;
	}

	public get Width()
	{
		return this.right - this.left;
	}

	public get Height()
	{
		return this.bottom - this.top;
	}
}
