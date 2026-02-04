import { action, makeObservable, observable } from "mobx";
import type Axial from "../Axial";
import Point from "../Point";
import Rectangle from "../Rectangle";
import Icon from "./Icon";
import APIDynamicTile from "../API/DynamicTile";

export const MIN_X_M = -1091.99999997;
export const MAX_X_M = 1091.99999997;
export const MIN_Y_M = -944.999999958091;
export const MAX_Y_M = 944.999999958091;

export default class Tile
{
	public readonly axial: Axial;
	public readonly radius: number;
	public readonly position: Point;
	public readonly worldPosition: Point;
	public readonly rectangle: Rectangle;
	public readonly outline: Point[];
	public readonly name: string;
	public readonly key: string;
	public readonly icons: Icon[] = [];

	constructor( tName: string, tKey: string, tPosition: Axial, tRadius: number )
	{
		makeObservable<Tile>(
			this,
			{
				icons: observable.shallow,
				Load: action,
				Update: action
			}
		);

		this.name = tName;
		this.key = tKey;
		this.axial = tPosition;
		this.radius = tRadius;
		this.position = new Point( this.radius * ( 3 / 2 ) * this.axial.q, this.radius * Math.sqrt( 3 ) * ( this.axial.r + this.axial.q / 2 ) );

		// World
		const tempRadiusMeters = ( MAX_X_M - MIN_X_M ) / 2;
		this.worldPosition = new Point( tempRadiusMeters * ( 3 / 2 ) * this.axial.q, tempRadiusMeters * Math.sqrt( 3 ) * ( this.axial.r + this.axial.q / 2 ) );

		// Rectangle
		const tempX = this.radius * ( 3 / 2 ) * this.axial.q;
		const tempHeight = Math.sqrt( 3 ) * this.radius;
		const tempY = tempHeight * ( this.axial.r + this.axial.q / 2 );
		const tempHalfHeight = tempHeight / 2;
		this.rectangle = new Rectangle( tempX - this.radius, tempY - tempHalfHeight, tempX + this.radius, tempY + tempHalfHeight );

		// Outline
		this.outline = [
			new Point( this.position.x - this.radius / 2, this.position.y - tempHeight / 2 ),
			new Point( this.position.x + this.radius / 2, this.position.y - tempHeight / 2 ),
			new Point( this.position.x + this.radius, this.position.y ),
			new Point( this.position.x + this.radius / 2, this.position.y + tempHeight / 2 ),
			new Point( this.position.x - this.radius / 2, this.position.y + tempHeight / 2 ),
			new Point( this.position.x - this.radius, this.position.y )
		];
	}

	public GetPixelPosition( tNormalizedPosition: Point ): Point
	{
		return new Point( this.rectangle.left + this.rectangle.Width * tNormalizedPosition.x, this.rectangle.top + this.rectangle.Height * tNormalizedPosition.y );
	}

	public GetWorldPosition( tNormalizedPosition: Point ): Point
	{
		const tempX = MIN_X_M + ( MAX_X_M - MIN_X_M ) * tNormalizedPosition.x;
		const tempY = MAX_Y_M - ( MAX_Y_M - MIN_Y_M ) * tNormalizedPosition.y;

		return new Point( this.worldPosition.x + tempX, -this.worldPosition.y + tempY );
	}

	public Load( tDynamicTile: APIDynamicTile | null )
	{
		this.icons.length = 0; // this won't immediately reflect world binds, assumed first load

		if ( tDynamicTile?.mapItems != null )
		{
			for ( let i = tDynamicTile.mapItems.length - 1; i >= 0; --i )
			{
				const tempMapItem = tDynamicTile.mapItems[ i ];
				const tempIcon = new Icon( this, new Point( tempMapItem.x ?? 0, tempMapItem.y ?? 0 ) );
				tempIcon.Load( tempMapItem );

				this.icons.push( tempIcon );
			}
		}
	}

	public Update( tDynamicTile: APIDynamicTile | null )
	{
		if ( tDynamicTile?.mapItems != null && this.icons.length > 0 )
		{
			const tempIcons = new Map<string, Icon>( this.icons.map( x => [ `${x.position.x}${x.position.y}`, x ] ) );
		
			// Add new or update
			for ( const tempMapItem of tDynamicTile.mapItems )
			{
				const tempKey = `${tempMapItem.x ?? 0}${tempMapItem.y ?? 0}`;
				const tempIcon = tempIcons.get( tempKey );

				// New
				if ( tempIcon == null )
				{
					const tempNewIcon = new Icon( this, new Point( tempMapItem.x ?? 0, tempMapItem.y ?? 0 ) );
					tempNewIcon.Load( tempMapItem );

					this.icons.push( tempNewIcon );
				}
				// Update
				else
				{
					tempIcon.Load( tempMapItem );
				}

				tempIcons.delete( tempKey );
			}

			// Delete remaining
			for ( let i = this.icons.length - 1; i >= 0; --i )
			{
				const tempIcon = this.icons[ i ];
				const tempKey = `${tempIcon.position.x}${tempIcon.position.y}`;

				if ( tempIcons.has( tempKey ) )
				{
					this.icons.splice( i, 1 );
				}
			}
		}
	}
}
