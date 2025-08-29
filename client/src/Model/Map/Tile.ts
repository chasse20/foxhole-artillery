import type Axial from "../Axial";
import Point from "../Point";
import Rectangle from "../Rectangle";

export default class Tile
{
	public readonly axial: Axial;
	public readonly radius: number;
	public readonly worldPosition: Point;
	public readonly rectangle: Rectangle;
	public readonly name: string;
	public readonly key: string;

	constructor( tName: string, tKey: string, tPosition: Axial, tRadius: number )
	{
		this.name = tName;
		this.key = tKey;
		this.axial = tPosition;
		this.radius = tRadius;

		this.worldPosition = new Point( this.radius * ( 3 / 2 ) * this.axial.q, this.radius * Math.sqrt( 3 ) * ( this.axial.r + this.axial.q / 2 ) );
		const tempHeight = Math.sqrt( 3 ) * this.radius;
		const tempHalfHeight = tempHeight / 2;
		this.rectangle = new Rectangle( this.worldPosition.x - this.radius, this.worldPosition.y - tempHalfHeight, this.worldPosition.x + this.radius, this.worldPosition.y + tempHalfHeight );
	}

	public GetWorldPosition( tLocalPosition: Point ): Point
	{
		return new Point( this.rectangle.left + tLocalPosition.x * this.rectangle.Width, this.rectangle.top + tLocalPosition.y * this.rectangle.Height );
	}
}
