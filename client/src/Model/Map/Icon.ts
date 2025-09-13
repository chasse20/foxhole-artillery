import Point from "../Point";
import type { TeamType } from "./TeamType";
import type Tile from "./Tile";

export type Snapshot =
{
	position: Point;
	type: number;
	team: TeamType;
};

export default class Icon
{
	public readonly position: Point;
	public readonly worldPosition: Point;
	public readonly pixelPosition: Point;
	public readonly type: number;
	public readonly team: TeamType;

	constructor( tTile: Tile, tPosition: Point, tType: number, tTeam: TeamType )
	{
		this.position = tPosition;
		this.worldPosition = tTile.GetWorldPosition( this.position );
		this.pixelPosition = tTile.GetPixelPosition( this.position );
		this.type = tType;
		this.team = tTeam;
	}
	
	public get Snapshot(): Snapshot
	{
		return {
			position: this.position,
			type: this.type,
			team: this.team
		};
	}
}
