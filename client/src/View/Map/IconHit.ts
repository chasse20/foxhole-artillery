import type Icon from "../../Model/Map/Icon";
import type Tile from "../../Model/Map/Tile";

export default class IconHit
{
	public readonly tile: Tile;
	public readonly icon: Icon;
	public readonly half: number;

	constructor( tTile: Tile, tIcon: Icon, tHalf: number )
	{
		this.tile = tTile;
		this.icon = tIcon;
		this.half = tHalf;
	}
}
