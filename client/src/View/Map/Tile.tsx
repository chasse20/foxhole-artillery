import React from "react";
import { observer } from "mobx-react-lite";
import TileModel from "../../Model/Map/Tile";
import Icon from "./Icon";

const TILE_URLS = (
	() =>
	{
		const tempRaw = import.meta.glob<string>( "../../assets/tiles/*.png", { eager: true, query: "?url", import: "default" } ) as Record<string, string>;
		const tempMap: Record<string, string> = {};

		for ( const [ key, value ] of Object.entries( tempRaw ) )
		{
			const tempStart = key.lastIndexOf( "/" ) + 1;
			const tempEnd = key.length - 4; // ".png"
			tempMap[ key.slice( tempStart, tempEnd ) ] = value;
		}

		return tempMap;
	}
)();

export const Tile = observer(
	function TileView( { tile }: { tile: TileModel } )
	{
		const tempURL = TILE_URLS[ tile.key ];

		// Tile container (absolute in world space)
		const tempBoxStyle: React.CSSProperties = {
			position: "absolute",
			left: tile.rectangle.left,
			top: tile.rectangle.top,
			width: tile.rectangle.Width,
			height: tile.rectangle.Height
		};

		// Base image (non-interactive so panning passes through)
		const tempImageStyle: React.CSSProperties = {
			position: "absolute",
			inset: 0,
			width: "100%",
			height: "100%",
			pointerEvents: "none",
			imageRendering: "auto",
			userSelect: "none",
			WebkitUserSelect: "none"
		};

		return (
			<div style={tempBoxStyle}>
				<img
					src={ tempURL }
					alt={ tile.name }
					style={ tempImageStyle }
					draggable={ false }
					decoding="async"
					loading="eager"
				/>

				{
					tile.icons.map( ( tIcon, tIndex ) =>
						<Icon key={`icon-${tile.key}-${tIndex}`} icon={tIcon} />
					)
				}
			</div>
		);
	}
);
