import { action, makeObservable, observable } from "mobx";
import type Axial from "../Axial";
import Point from "../Point";
import Rectangle from "../Rectangle";
import type { Snapshot as IconSnapshot } from "./Icon";
import Icon from "./Icon";
import API from "../API/API";
import TileData from "../API/Tile";
import { TeamType } from "./TeamType";

export const MIN_X_M = -1091.99999997;
export const MAX_X_M = 1091.99999997;
export const MIN_Y_M = -944.999999958091;
export const MAX_Y_M = 944.999999958091;

export type Snapshot =
{
	icons: IconSnapshot[];
};

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
		makeObservable<Tile, "HandleUpdate">(
			this,
			{
				HandleUpdate: action,
				icons: observable.shallow,
				Load: action
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

		return new Point( this.worldPosition.x + tempX, this.worldPosition.y + tempY );
	}

	public get Snapshot(): Snapshot
	{
		return {
			icons: this.icons.flatMap( x => x.Snapshot )
		};
	}

	public Load( tSnapshot: Snapshot )
	{
		// Icons
		this.icons.length = 0;
		const tempListLength = tSnapshot.icons.length;

		for ( let i = 0; i < tempListLength; ++i )
		{
			const tempSnapshot = tSnapshot.icons[ i ];
			const tempIcon = new Icon( this, tempSnapshot.position, tempSnapshot.type, tempSnapshot.team );
			this.icons.push( tempIcon );
		}
	}

	public async UpdateAsync( tAPI: API )
	{
		this.HandleUpdate( await tAPI.GetTileAsync( this.key ) );
	}

	protected HandleUpdate( tData: TileData | null )
	{
		if ( tData != null && tData.mapItems != null )
		{
			this.icons.length = 0;
			const tempListLength = tData.mapItems.length;

			for ( let i = 0; i < tempListLength; ++i )
			{
				const tempIconData = tData.mapItems[ i ];
				const tempTeam = tempIconData.teamId == null || tempIconData.teamId == "NONE" ? TeamType.Neutral : ( tempIconData.teamId == "WARDENS" ? TeamType.Warden : TeamType.Colonial );
				const tempIcon = new Icon( this, new Point( tempIconData.x ?? 0, tempIconData.y ?? 0 ), tempIconData.iconType ?? 0, tempTeam )
				this.icons.push( tempIcon );
			}
		}
	}
}
