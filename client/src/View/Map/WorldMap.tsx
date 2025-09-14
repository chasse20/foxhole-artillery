import React from "react";
import { useApp } from "../AppContext.tsx";
import { observer } from "mobx-react-lite";
import type TileModel from "../../Model/Map/Tile";
import { MIN_X_M, MAX_X_M, MIN_Y_M, MAX_Y_M } from "../../Model/Map/Tile.ts";
import { TeamType } from "../../Model/Map/TeamType";

// ----------------------------
// Helpers
// ----------------------------

function HexPathPoints( tCenterX: number, tCenterY: number, tRadius: number )
{
	const tempH = Math.sqrt( 3 ) * tRadius;
	return [
		{ x: tCenterX - tRadius / 2, y: tCenterY - tempH / 2 },
		{ x: tCenterX + tRadius / 2, y: tCenterY - tempH / 2 },
		{ x: tCenterX + tRadius,     y: tCenterY },
		{ x: tCenterX + tRadius / 2, y: tCenterY + tempH / 2 },
		{ x: tCenterX - tRadius / 2, y: tCenterY + tempH / 2 },
		{ x: tCenterX - tRadius,     y: tCenterY }
	];
}

function GetIconScreenSize( tZoom: number ): number
{
	return Math.min( 30, Math.max( 30, 1 / tZoom ) );
}

function GetTeamTintRGB( tTeam: TeamType ): { r: number; g: number; b: number }
{
	switch ( tTeam )
	{
		case TeamType.Warden:   return { r: 72, g: 125, b: 169 };
		case TeamType.Colonial: return { r: 101, g: 135, b: 94 };
		default:                return { r: 255, g: 255, b: 255 };
	}
}

function MakeRGBA( r: number, g: number, b: number, a: number = 1 ): string
{
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ----------------------------
// Image caches (tiles, base icons, tinted icons)
// ----------------------------

type ImageCache = Map<string, HTMLImageElement>;
const gTileImages: ImageCache = new Map();
const gIconImages: ImageCache = new Map();
const gTintedIcons: Map<string, HTMLCanvasElement> = new Map();

function LoadImage( tURL: string, tOnLoad: () => void ): HTMLImageElement
{
	let tempImage = gIconImages.get( tURL ) ?? gTileImages.get( tURL );
	if ( tempImage != null )
	{
		return tempImage;
	}

	tempImage = new Image();
	tempImage.decoding = "async";
	tempImage.loading = "eager";
	tempImage.addEventListener( "load", tOnLoad, { once: true } );
	tempImage.src = tURL;

	if ( tURL.includes( "/tiles/" ) )
	{
		gTileImages.set( tURL, tempImage );
	}
	else
	{
		gIconImages.set( tURL, tempImage );
	}
	return tempImage;
}

function GetTintedIconCanvas( tBase: HTMLImageElement, tColor: { r: number; g: number; b: number }, tKey: string ): HTMLCanvasElement
{
	const tempExisting = gTintedIcons.get( tKey );
	if ( tempExisting != null )
	{
		return tempExisting;
	}

	const tempCanvas = document.createElement( "canvas" );
	const tempWidth = Math.max( 1, tBase.naturalWidth );
	const tempHeight = Math.max( 1, tBase.naturalHeight );
	tempCanvas.width = tempWidth;
	tempCanvas.height = tempHeight;

	const tempContext = tempCanvas.getContext( "2d", { willReadFrequently: false } )!;
	// 1) draw the base icon
	tempContext.globalCompositeOperation = "source-over";
	tempContext.clearRect( 0, 0, tempWidth, tempHeight );
	tempContext.drawImage( tBase, 0, 0, tempWidth, tempHeight );

	// 2) multiply tint color
	tempContext.globalCompositeOperation = "multiply";
	tempContext.fillStyle = MakeRGBA( tColor.r, tColor.g, tColor.b, 1 );
	tempContext.fillRect( 0, 0, tempWidth, tempHeight );

	// 3) keep original alpha
	tempContext.globalCompositeOperation = "destination-in";
	tempContext.drawImage( tBase, 0, 0, tempWidth, tempHeight );

	gTintedIcons.set( tKey, tempCanvas );
	return tempCanvas;
}

// ----------------------------
type IconHit = { tile: TileModel; iconIndex: number; cx: number; cy: number; half: number };
// ----------------------------

export const WorldMap = observer(
	function WorldMap()
	{
		const tempApp = useApp();

		const tempWrapRef = React.useRef<HTMLDivElement | null>( null );
		const tempCanvasRef = React.useRef<HTMLCanvasElement | null>( null );

		const tempRafRef = React.useRef<number | null>( null );
		const tempNeedsRenderRef = React.useRef<boolean>( true );

		const tempDragRef = React.useRef<{ x: number; y: number } | null>( null );
		const tempPanDeltaRef = React.useRef( { dx: 0, dy: 0 } );

		const tempIconHitsRef = React.useRef<IconHit[]>( [] );

		// Keep canvas sized to CSS pixel box with DPR backing
		React.useEffect(
			() =>
			{
				const tempElement = tempWrapRef.current;
				const tempCanvas = tempCanvasRef.current;
				if ( tempElement == null || tempCanvas == null ) return;

				const OnResize = () =>
				{
					const tempRect = tempElement.getBoundingClientRect();
					const tempDPR = window.devicePixelRatio || 1;

					tempCanvas.style.width = `${tempRect.width}px`;
					tempCanvas.style.height = `${tempRect.height}px`;
					tempCanvas.width = Math.max( 1, Math.floor( tempRect.width  * tempDPR ) );
					tempCanvas.height = Math.max( 1, Math.floor( tempRect.height * tempDPR ) );

					tempNeedsRenderRef.current = true;
					QueueRender();
				};

				const tempObserver = new ResizeObserver( OnResize );
				tempObserver.observe( tempElement );
				OnResize();

				return () => tempObserver.disconnect();
			},
			[]
		);

		function QueueRender()
		{
			if ( tempRafRef.current != null ) return;
			tempRafRef.current = requestAnimationFrame(
				() =>
				{
					tempRafRef.current = null;
					if ( tempNeedsRenderRef.current )
					{
						tempNeedsRenderRef.current = false;
						Draw();
					}
				}
			);
		}

		// Wheel zoom (cursor-anchored)
		React.useEffect(
			() =>
			{
				const tempElement = tempWrapRef.current; if ( tempElement == null ) return;
				let tempQueued = false;

				const OnWheel = ( tEvent: WheelEvent ) =>
				{
					tEvent.preventDefault();

					const tempRect = tempElement.getBoundingClientRect();
					const tempClientX = tEvent.clientX - tempRect.left;
					const tempClientY = tEvent.clientY - tempRect.top;
					const tempK = Math.exp( -tEvent.deltaY * 0.0015 );

					const Apply = () =>
					{
						const tempOldZ = tempApp.map.Zoom > 0 ? tempApp.map.Zoom : 0.6;
						const tempNewZ = Math.min( 5, Math.max( 0.1, tempOldZ * tempK ) );
						const tempS = tempNewZ / tempOldZ;

						tempApp.map.X = tempClientX - tempS * ( tempClientX - tempApp.map.X );
						tempApp.map.Y = tempClientY - tempS * ( tempClientY - tempApp.map.Y );
						tempApp.map.Zoom = tempNewZ;

						tempNeedsRenderRef.current = true;
						tempQueued = false;
						QueueRender();
					};

					if ( !tempQueued )
					{
						tempQueued = true;
						requestAnimationFrame( Apply );
					}
				};

				tempElement.addEventListener( "wheel", OnWheel, { passive: false } );
				return () => tempElement.removeEventListener( "wheel", OnWheel );
			},
			[ tempApp.map ]
		);

		// Pointer pan (rAF-coalesced)
		const OnPointerDown = ( tEvent: React.PointerEvent ) =>
		{
			( tEvent.currentTarget as Element ).setPointerCapture( tEvent.pointerId );
			tempDragRef.current = { x: tEvent.clientX, y: tEvent.clientY };
		};

		const OnPointerMove = ( tEvent: React.PointerEvent ) =>
		{
			const tempDrag = tempDragRef.current; if ( tempDrag == null ) return;
			const tempDx = tEvent.clientX - tempDrag.x;
			const tempDy = tEvent.clientY - tempDrag.y;
			tempDragRef.current = { x: tEvent.clientX, y: tEvent.clientY };

			tempPanDeltaRef.current.dx += tempDx;
			tempPanDeltaRef.current.dy += tempDy;

			if ( tempRafRef.current == null )
			{
				tempRafRef.current = requestAnimationFrame(
					() =>
					{
						tempRafRef.current = null;

						const { dx, dy } = tempPanDeltaRef.current;
						if ( dx || dy )
						{
							tempApp.map.X = tempApp.map.X + dx;
							tempApp.map.Y = tempApp.map.Y + dy;
							tempPanDeltaRef.current = { dx: 0, dy: 0 };

							tempNeedsRenderRef.current = true;
							QueueRender();
						}
					}
				);
			}
		};

		const OnPointerUp = ( tEvent: React.PointerEvent ) =>
		{
			tempDragRef.current = null;
			( tEvent.currentTarget as Element ).releasePointerCapture( tEvent.pointerId );
		};

		// Click hit test (CSS px -> world coords)
		const OnClick = ( tEvent: React.MouseEvent ) =>
		{
			const tempCanvas = tempCanvasRef.current; if ( tempCanvas == null ) return;

			const tempRect = tempCanvas.getBoundingClientRect();
			const tempScreenX = tEvent.clientX - tempRect.left;
			const tempScreenY = tEvent.clientY - tempRect.top;

			const tempWorldX = ( tempScreenX - tempApp.map.X ) / tempApp.map.Zoom;
			const tempWorldY = ( tempScreenY - tempApp.map.Y ) / tempApp.map.Zoom;

			const tempHits = tempIconHitsRef.current;
			for ( let i = tempHits.length - 1; i >= 0; --i )
			{
				const tempHit = tempHits[ i ];
				if ( Math.abs( tempWorldX - tempHit.cx ) <= tempHit.half &&
					 Math.abs( tempWorldY - tempHit.cy ) <= tempHit.half )
				{
					// TODO: wire your icon click
					console.log("Clicked icon", tempHit.tile.key, tempHit.iconIndex);
					break;
				}
			}
		};

		// Update button
		const [ tempUpdating, setTempUpdating ] = React.useState( false );
		const OnUpdateClick = React.useCallback(
			async () =>
			{
				if ( tempUpdating ) return;
				setTempUpdating( true );
				try
				{
					await tempApp.UpdateAsync();
				}
				finally
				{
					setTempUpdating( false );
					tempNeedsRenderRef.current = true;
					QueueRender();
				}
			},
			[ tempApp, tempUpdating ]
		);

		// Draw everything
		function Draw()
		{
			const tempCanvas = tempCanvasRef.current; if ( tempCanvas == null ) return;
			const tempContext = tempCanvas.getContext( "2d" )!;
			const tempDPR = window.devicePixelRatio || 1;

			// Reset to device pixels and clear
			tempContext.setTransform( 1, 0, 0, 1, 0, 0 );
			tempContext.clearRect( 0, 0, tempCanvas.width, tempCanvas.height );

			// Scale once to CSS px
			tempContext.scale( tempDPR, tempDPR );

			// Now all coordinates we use are in CSS pixels.
			// Apply world transform (CSS px space)
			const tempZoom = tempApp.map.Zoom > 0 ? tempApp.map.Zoom : 0.6;
			tempContext.translate( tempApp.map.X, tempApp.map.Y );
			tempContext.scale( tempZoom, tempZoom );

			// World background
			tempContext.fillStyle = "#111827"; // bg-neutral-900
			tempContext.fillRect( -1e6, -1e6, 2e6, 2e6 );

			// Tiles
			for ( let i = 0; i < tempApp.map.tiles.length; ++i )
			{
				const tempTile = tempApp.map.tiles[ i ];
				const tempURL = `/tiles/${tempTile.key}.png`;
				const tempImage = LoadImage( tempURL, () => { tempNeedsRenderRef.current = true; QueueRender(); } );

				if ( tempImage.complete && tempImage.naturalWidth > 0 )
				{
					tempContext.imageSmoothingEnabled = true;
					tempContext.drawImage(
						tempImage,
						tempTile.rectangle.left,
						tempTile.rectangle.top,
						tempTile.rectangle.Width,
						tempTile.rectangle.Height
					);
				}
				else
				{
					tempContext.fillStyle = "#0b0f19";
					tempContext.fillRect( tempTile.rectangle.left, tempTile.rectangle.top, tempTile.rectangle.Width, tempTile.rectangle.Height );
				}
			}

			// Grid (125m), anchored at Deadlands if present
			DrawGrid( tempContext );

			// Hex borders (constant on-screen thickness: scale by 1/zoom)
			tempContext.save();
			tempContext.lineWidth = 1.25 / tempZoom;
			tempContext.strokeStyle = "rgba(255,255,255,0.5)";
			for ( let i = 0; i < tempApp.map.tiles.length; ++i )
			{
				const tempTile = tempApp.map.tiles[ i ];
				const tempPts = HexPathPoints( tempTile.position.x, tempTile.position.y, tempTile.radius );
				tempContext.beginPath();
				tempContext.moveTo( tempPts[ 0 ].x, tempPts[ 0 ].y );
				for ( let j = 1; j < tempPts.length; ++j )
				{
					tempContext.lineTo( tempPts[ j ].x, tempPts[ j ].y );
				}
				tempContext.closePath();
				tempContext.stroke();
			}
			tempContext.restore();

			// Icons (keep hit regions)
			tempIconHitsRef.current = [];
			DrawIcons( tempContext, tempZoom );
		}

		function DrawGrid( tContext: CanvasRenderingContext2D )
		{
			const tempTiles = tempApp.map.tiles;
			if ( tempTiles.length === 0 ) return;

			const tempTile = tempTiles[ 0 ];
			const tempPxPerMeterX = tempTile.rectangle.Width  / ( MAX_X_M - MIN_X_M );
			const tempPxPerMeterY = tempTile.rectangle.Height / ( MAX_Y_M - MIN_Y_M );
			const tempCellW = 125 * tempPxPerMeterX; // 125m
			const tempCellH = 125 * tempPxPerMeterY;

			const tempOriginTile = tempTiles.find( x => x.axial.q === 0 && x.axial.r === 0 ) ?? tempTile;
			const tempAnchorX = tempOriginTile.position.x;
			const tempAnchorY = tempOriginTile.position.y;

			const tempB = tempApp.map.WorldBounds;

			const tempStartX = tempAnchorX + Math.floor( ( tempB.left - tempAnchorX ) / tempCellW ) * tempCellW;
			const tempStartY = tempAnchorY + Math.floor( ( tempB.top  - tempAnchorY ) / tempCellH ) * tempCellH;

			const tempZoom = Math.max( 0.001, tempApp.map.Zoom );
			tContext.save();
			tContext.lineWidth = 0.75 / tempZoom;
			tContext.strokeStyle = "rgba(23,23,23,0.5)";

			for ( let x = tempStartX; x <= tempB.right; x += tempCellW )
			{
				tContext.beginPath();
				tContext.moveTo( x, tempB.top );
				tContext.lineTo( x, tempB.bottom );
				tContext.stroke();
			}

			for ( let y = tempStartY; y <= tempB.bottom; y += tempCellH )
			{
				tContext.beginPath();
				tContext.moveTo( tempB.left, y );
				tContext.lineTo( tempB.right, y );
				tContext.stroke();
			}

			tContext.restore();
		}

		function DrawIcons( tContext: CanvasRenderingContext2D, tZoom: number )
		{
			const tempTiles = tempApp.map.tiles;

			// Desired on-screen size (CSS px), convert to world units by 1/zoom.
			const tempScreenSize = GetIconScreenSize( tZoom );
			const tempWorldSize = tempScreenSize / tZoom;
			const tempHalf = tempWorldSize / 2;

			for ( let i = 0; i < tempTiles.length; ++i )
			{
				const tempTile = tempTiles[ i ];
				const tempIcons = tempTile.icons;
				if ( tempIcons.length === 0 ) continue;

				for ( let j = 0; j < tempIcons.length; ++j )
				{
					const tempIcon = tempIcons[ j ];

					const tempPx = tempTile.rectangle.left + tempTile.rectangle.Width  * tempIcon.position.x;
					const tempPy = tempTile.rectangle.top  + tempTile.rectangle.Height * tempIcon.position.y;

					const tempURL = `/icons/${tempIcon.type}.png`;
					const tempBase = LoadImage( tempURL, () => { tempNeedsRenderRef.current = true; QueueRender(); } );
					if ( !tempBase.complete || tempBase.naturalWidth === 0 ) continue;

					const { r, g, b } = GetTeamTintRGB( tempIcon.team );
					const tempTintKey = `${tempIcon.type}_${r}_${g}_${b}`;
					const tempTinted = GetTintedIconCanvas( tempBase, { r, g, b }, tempTintKey );

					tContext.imageSmoothingEnabled = true;
					tContext.drawImage( tempTinted, tempPx - tempHalf, tempPy - tempHalf, tempWorldSize, tempWorldSize );

					tempIconHitsRef.current.push( { tile: tempTile, iconIndex: j, cx: tempPx, cy: tempPy, half: tempHalf } );
				}
			}
		}

		// Kick an initial draw (and whenever React re-renders this component)
		React.useEffect(
			() =>
			{
				tempNeedsRenderRef.current = true;
				QueueRender();
			}
		);

		const tempRootClass = "relative h-full w-full overflow-hidden bg-neutral-900 overscroll-contain";
		const tempCanvasStyle: React.CSSProperties =
		{
			position: "absolute",
			inset: 0,
			touchAction: "none",
			userSelect: "none",
			WebkitUserSelect: "none",
			WebkitTapHighlightColor: "transparent"
		};

		return (
			<div
				ref={tempWrapRef}
				className={tempRootClass}
				onPointerDown={OnPointerDown}
				onPointerMove={OnPointerMove}
				onPointerUp={OnPointerUp}
				onClick={OnClick}
			>
				<button
					className="absolute right-3 top-3 z-10 rounded-md border border-white/10 bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-800"
					onClick={OnUpdateClick}
					onPointerDown={ e => e.stopPropagation() }
					disabled={tempUpdating}
				>
					{ tempUpdating ? "Updating…" : "Update" }
				</button>

				<canvas ref={tempCanvasRef} style={tempCanvasStyle}/>
			</div>
		);
	}
);
