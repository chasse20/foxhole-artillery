import React from "react";
import type IconModel from "../../Model/Map/Icon";

export default function IconView( { icon }: { icon: IconModel } )
{
	const tempLeft = icon.pixelPosition.x;
	const tempTop = icon.pixelPosition.y;

	const tempStyle: React.CSSProperties = {
		position: "absolute",
		left: tempLeft,
		top: tempTop,
		width: 24,
		height: 24,
		transform: "translate(-50%, -50%)",
		pointerEvents: "none",
		zIndex: 2
	};

	return (
		<img
			key={`icon-${icon.type}-${icon.team}-${tempLeft}-${tempTop}`}
			data-marker="1"
			src={`/icons/${icon.type}_${icon.team}.png`}
			alt=""
			style={tempStyle}
			draggable={false}
			decoding="async"
		/>
	);
}
