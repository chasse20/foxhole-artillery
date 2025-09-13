import React from "react";
import type IconModel from "../../Model/Map/Icon";
import { TeamType } from "../../Model/Map/TeamType";

export default function IconView( { icon }: { icon: IconModel } )
{
	const tempLeft = icon.pixelPosition.x;
	const tempTop = icon.pixelPosition.y;
	const tempColor = icon.team == TeamType.Neutral ? "rgba(255,255,255,1)" : ( icon.team == TeamType.Warden ? "rgba(72,125,169,1)" : "rgba(101,135,94)" );
	const tempURL = `/icons/${icon.type}.png`;

	const tempBoxStyle: React.CSSProperties =
	{
		position: "absolute",
		left: tempLeft,
		top: tempTop,
		width: "calc(24px * var(--wm-icon-scale, 1))",
		height: "calc(24px * var(--wm-icon-scale, 1))",
		transform: "translate(-50%, -50%)",
		pointerEvents: "none",
		zIndex: 2,
		backgroundColor: tempColor,
		WebkitMaskImage: `url(${tempURL})`,
		WebkitMaskRepeat: "no-repeat",
		WebkitMaskSize: "contain",
		WebkitMaskPosition: "center",
		maskImage: `url(${tempURL})`,
		maskRepeat: "no-repeat",
		maskSize: "contain",
		maskPosition: "center",
		isolation: "isolate"
	};

	const tempImgStyle: React.CSSProperties =
	{
		position: "absolute",
		inset: 0,
		width: "100%",
		height: "100%",
		objectFit: "contain",
		mixBlendMode: "multiply", // <- preserves grayscale shading via multiply
		pointerEvents: "none"
	};

	return (
		<div data-marker="1" aria-hidden style={tempBoxStyle}>
			<img
				src={tempURL}
				alt=""
				style={tempImgStyle}
				draggable={false}
				decoding="async"
			/>
		</div>
	);
}
