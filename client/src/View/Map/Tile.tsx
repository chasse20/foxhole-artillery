import React from "react";
import TileModel from "../../Model/Map/Tile"

const TILE_URLS = (
	() =>
	{
		const tempRaw = import.meta.glob<string>( "../../assets/tiles/*.png", { eager: true, query: "?url", import: "default" } ) as Record<string, string>;
		const tempMap: Record<string, string> = {};

		for ( const [ key, value ] of Object.entries( tempRaw ) )
		{
			const tempString = key.lastIndexOf( "/" ) + 1;
			const tempExtension = key.length - 4; // ".png"

			tempMap[ key.slice( tempString, tempExtension ) ] = value;
		}
		return tempMap;
	}
)();

function TileViewBase( { tile }: { tile: TileModel } )
{
	const tempURL = TILE_URLS[ tile.key ];
	const tempStyle: React.CSSProperties = {
		position: "absolute",
		left: `${tile.rectangle.left}px`,
		top: `${tile.rectangle.top}px`,
		width: `${tile.rectangle.Width}px`,
		height: `${tile.rectangle.Height}px`,
		pointerEvents: "none",
		imageRendering: "auto"
	};

	return (
		<img
			src={ tempURL }
			alt={ tile.name }
			style={ tempStyle }
			draggable={ false }
			decoding="async"
			loading="eager"
		/>
	);
}

// Memoize to avoid re-rendering unless the tile reference changes
const TileView = React.memo( TileViewBase, ( a, b ) => a.tile === b.tile );
export default TileView;
