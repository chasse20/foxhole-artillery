import { action, computed, makeObservable, observable } from "mobx";
import Point from "../Point";
import { TeamType } from "./TeamType";
import APITileItem from "../API/TileItem";
import type Tile from "./Tile";

export default class Icon
{
	public readonly position: Point;
	public readonly worldPosition: Point;
	public readonly pixelPosition: Point;
	protected _type: number = 0;
	protected _team: TeamType = TeamType.Neutral;

	constructor( tTile: Tile, tPosition: Point )
	{
		makeObservable<Icon, "_type" | "_team">(
			this,
			{
				_type: observable,
				Type: computed,
				_team: observable,
				Team: computed,
				Load: action
			}
		);

		this.position = tPosition;
		this.worldPosition = tTile.GetWorldPosition( this.position );
		this.pixelPosition = tTile.GetPixelPosition( this.position );
	}

	public get Type()
	{
		return this._type;
	}

	public get Team()
	{
		return this._team;
	}

	public Load( tTileItem: APITileItem | null )
	{
		if ( tTileItem != null )
		{
			this._type = tTileItem.iconType ?? 0;
			this._team = tTileItem.teamId == null || tTileItem.teamId == "NONE" ? TeamType.Neutral : ( tTileItem.teamId == "WARDENS" ? TeamType.Warden : TeamType.Colonial );
		}
	}
}
