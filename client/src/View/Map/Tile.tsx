import React from "react";
import { observer } from "mobx-react-lite";
import TileModel from "../../Model/Map/Tile";
import Icon from "./Icon";

export const Tile = observer(
	function TileView( { tile }: { tile: TileModel } )
	{
		const tempBoxStyle: React.CSSProperties = {
			position: "absolute",
			left: tile.rectangle.left,
			top: tile.rectangle.top,
			width: tile.rectangle.Width,
			height: tile.rectangle.Height
		};

		const tempImageStyle: React.CSSProperties = {
			position: "absolute",
			inset: 0,
			width: "100%",
			height: "100%",
			pointerEvents: "none",
			imageRendering: "auto",
			userSelect: "none",
			WebkitUserSelect: "none",
			backfaceVisibility: "hidden"
		};

		return (
			<div style={tempBoxStyle}>
				<img
					src={ `/tiles/${tile.key}.png` }
					alt={ tile.name }
					style={ tempImageStyle }
					draggable={ false }
					decoding="sync"
					loading="eager"
					fetchPriority="high"
				/>

				{ tile.icons.map( ( tIcon, tIndex ) =>
					<Icon key={`icon-${tile.key}-${tIndex}`} icon={tIcon} />
				) }
			</div>
		);
	}
);
