import React from "react";
import { comparer, reaction as mobxReaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import { useApp } from "../AppContext.tsx";
import { observer } from "mobx-react-lite";
import { MIN_X_M, MAX_X_M, MIN_Y_M, MAX_Y_M } from "../../Model/Map/Tile.ts";
import WorldMapCache from "./WorldMapCache.ts";
import IconHit from "./IconHit.ts";
import MathUtility from "../../Model/Utility/MathUtility.ts";

const CACHE = new WorldMapCache();

export const WorldMap = observer(
	function WorldMap()
	{
		const tempApp = useApp();
		const [ isUpdating, setIsUpdating ] = React.useState( false );

		const tempWrapRef = React.useRef<HTMLDivElement | null>( null );
		const tempCanvasRef = React.useRef<HTMLCanvasElement | null>( null );
		const tempIconHitsRef = React.useRef<IconHit[]>( [] );
		const tempAnimationRef = React.useRef<number | null>( null );
		const tempNeedsRenderRef = React.useRef<boolean>( true );
		const tempDragRef = React.useRef<{ x: number; y: number } | null>( null );
		const tempPanDeltaRef = React.useRef( { dx: 0, dy: 0 } );

		// Keep canvas sized to CSS pixel box with DPR
		React.useEffect(
			() =>
			{
				const tempElement = tempWrapRef.current;
				const tempCanvas = tempCanvasRef.current;

				if ( tempElement != null && tempCanvas != null )
				{
					const OnResize = () =>
					{
						const tempRect = tempElement.getBoundingClientRect();
						const tempDPR = window.devicePixelRatio || 1;

						tempCanvas.style.width = `${tempRect.width}px`;
						tempCanvas.style.height = `${tempRect.height}px`;
						tempCanvas.width = Math.max( 1, Math.floor( tempRect.width * tempDPR ) );
						tempCanvas.height = Math.max( 1, Math.floor( tempRect.height * tempDPR ) );

						tempNeedsRenderRef.current = true;
						QueueRender();
					};

					const tempObserver = new ResizeObserver( OnResize );
					tempObserver.observe( tempElement );
					OnResize();

					return () => tempObserver.disconnect();
				}
			},
			[]
		);

		function QueueRender()
		{
			if ( tempAnimationRef.current == null )
			{
				tempAnimationRef.current = requestAnimationFrame(
					() =>
					{
						tempAnimationRef.current = null;

						if ( tempNeedsRenderRef.current )
						{
							tempNeedsRenderRef.current = false;
							Draw();
						}
					}
				);
			}
		}

		// Zoom
		React.useEffect(
			() =>
			{
				const tempElement = tempWrapRef.current;

				if ( tempElement != null )
				{
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
				}
			},
			[ tempApp.map ]
		);

		// Drag
		const tempOnPointerDown = ( tEvent: React.PointerEvent ) =>
		{
			( tEvent.currentTarget as Element ).setPointerCapture( tEvent.pointerId );
			tempDragRef.current = { x: tEvent.clientX, y: tEvent.clientY };
		};

		const tempOnPointerMove = ( tEvent: React.PointerEvent ) =>
		{
			const tempDrag = tempDragRef.current;

			if ( tempDrag != null )
			{
				const tempDx = tEvent.clientX - tempDrag.x;
				const tempDy = tEvent.clientY - tempDrag.y;
				tempDragRef.current = { x: tEvent.clientX, y: tEvent.clientY };

				tempPanDeltaRef.current.dx += tempDx;
				tempPanDeltaRef.current.dy += tempDy;

				if ( tempAnimationRef.current == null )
				{
					tempAnimationRef.current = requestAnimationFrame(
						() =>
						{
							tempAnimationRef.current = null;
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
			}
		};

		const tempOnPointerUp = ( tEvent: React.PointerEvent ) =>
		{
			tempDragRef.current = null;
			( tEvent.currentTarget as Element ).releasePointerCapture( tEvent.pointerId );
		};

		// Icon Hit
		const tempOnClick = ( tEvent: React.MouseEvent ) =>
		{
			const tempCanvas = tempCanvasRef.current;

			if ( tempCanvas != null )
			{
				const tempRect = tempCanvas.getBoundingClientRect();
				const tempScreenX = tEvent.clientX - tempRect.left;
				const tempScreenY = tEvent.clientY - tempRect.top;
				const tempWorldX = ( tempScreenX - tempApp.map.X ) / tempApp.map.Zoom;
				const tempWorldY = ( tempScreenY - tempApp.map.Y ) / tempApp.map.Zoom;
				const tempHits = tempIconHitsRef.current;

				for ( let i = tempHits.length - 1; i >= 0; --i )
				{
					const tempHit = tempHits[ i ];

					if ( Math.abs( tempWorldX - tempHit.icon.pixelPosition.x ) <= tempHit.half && Math.abs( tempWorldY - tempHit.icon.pixelPosition.y ) <= tempHit.half )
					{
						tempApp.OnMapIconSelect( tempHit.icon );
						break;
					}
				}
			}
		};

		const tempOnUpdateClick = React.useCallback(
			async () =>
			{
				if ( !isUpdating )
				{
					setIsUpdating( true );

					try
					{
						await tempApp.UpdateAsync();
					}
					finally
					{
						setIsUpdating( false );
						tempNeedsRenderRef.current = true;
						QueueRender();
					}
				}
			},
			[ tempApp, isUpdating ]
		);

		// Fire Group
		React.useEffect(
			() =>
			{
				const dispose: IReactionDisposer = mobxReaction(
					() =>
					{
						const temp: unknown[] = [];

						for ( let i = 0; i < tempApp.fireGroups.length; ++i )
						{
							const g = tempApp.fireGroups[ i ];

							// Base bind
							temp.push( g.baseWorldBind.Icon );
							temp.push( g.baseWorldBind.coordinate.Distance );
							temp.push( g.baseWorldBind.coordinate.Angle );

							// Spotter bind
							temp.push( g.spotterWorldBind.Icon );
							temp.push( g.spotterWorldBind.coordinate.Distance );
							temp.push( g.spotterWorldBind.coordinate.Angle );

							// Spotter chain
							temp.push( g.spotters.length );
							for ( let s = 0; s < g.spotters.length; ++s )
							{
								const leg = g.spotters[ s ];
								temp.push( leg.Distance, leg.Angle );
							}

							// Active target
							temp.push( g.ActiveTarget );
							temp.push( g.ActiveTarget?.coordinate.Distance ?? 0 );
							temp.push( g.ActiveTarget?.coordinate.Angle ?? 0 );

							// Guns
							temp.push( g.guns.length );
							for ( let j = 0; j < g.guns.length; ++j )
							{
								const gun = g.guns[ j ];
								temp.push( gun.location.Distance, gun.location.Angle, gun.Type );
							}
						}

						return temp;
					},
					() =>
					{
						tempNeedsRenderRef.current = true;
						QueueRender();
					},
					{ equals: comparer.structural }
				);

				return dispose; // <-- return the disposer function itself
			},
			[ tempApp ] // same app instance
		);

		// Draw
		function WorldToPixel( tPoint: { x: number; y: number } ): { x: number; y: number }
		{
			// Use origin tile as the frame bridge (consistent across tiles)
			const tempTiles = tempApp.map.tiles;
			const tempTile = tempTiles.find( x => x.axial.q === 0 && x.axial.r === 0 ) ?? tempTiles[ 0 ];

			// Pixels-per-meter from a tile
			const tempPxPerMeterX = tempTile.rectangle.Width / ( MAX_X_M - MIN_X_M );
			const tempPxPerMeterY = tempTile.rectangle.Height / ( MAX_Y_M - MIN_Y_M );

			// Convert world (y-up) deltas to pixel (y-down)
			const tempDX = ( tPoint.x - tempTile.worldPosition.x ) * tempPxPerMeterX;
			const tempDY = -( tPoint.y - tempTile.worldPosition.y ) * tempPxPerMeterY;

			return { x: tempTile.position.x + tempDX, y: tempTile.position.y + tempDY };
		}

		function DrawFireGroups( tContext: CanvasRenderingContext2D, tZoom: number )
		{
			// Styling helpers
			const tempPx = ( n: number ) => n / Math.max( tZoom, 0.001 );
			const tempLineRed = () => { tContext.setLineDash( [] ); tContext.strokeStyle = "rgba(239,68,68,0.95)"; tContext.lineWidth = tempPx( 2.0 ); };
			const tempLineBlue = () => { tContext.setLineDash( [] ); tContext.strokeStyle = "rgba(59,130,246,0.95)"; tContext.lineWidth = tempPx( 2.0 ); };
			const tempLineGreenDashed = () => { tContext.setLineDash( [ tempPx( 8 ), tempPx( 6 ) ] ); tContext.strokeStyle = "rgba(34,197,94,0.95)"; tContext.lineWidth = tempPx( 2.0 ); };

			const tempDrawLine = ( ax: number, ay: number, bx: number, by: number ) =>
			{
				tContext.beginPath();
				tContext.moveTo( ax, ay );
				tContext.lineTo( bx, by );
				tContext.stroke();
			};

			const tempDrawX = ( x: number, y: number, r: number ) =>
			{
				tContext.save();
				tContext.lineWidth = tempPx( 4.0 );
				tContext.setLineDash( [] );
				tContext.strokeStyle = "rgba(34,197,94,0.95)"; // same green, thicker
				tContext.beginPath();
				tContext.moveTo( x - r, y - r );
				tContext.lineTo( x + r, y + r );
				tContext.moveTo( x - r, y + r );
				tContext.lineTo( x + r, y - r );
				tContext.stroke();
				tContext.restore();
			};

			for ( let i = tempApp.fireGroups.length - 1; i >= 0; --i )
			{
				const tempGroup = tempApp.fireGroups[ i ];

				// Base
				if ( tempGroup.IsVisible && tempGroup.baseWorldBind.Icon != null )
				{
					const tempBaseIcon = tempGroup.baseWorldBind.Icon!;
					const tempBasePhi = MathUtility.GetCompassToRadians( tempGroup.baseWorldBind.coordinate.Angle );
					const tempBaseDX = tempGroup.baseWorldBind.coordinate.Distance * Math.cos( tempBasePhi );
					const tempBaseDY = tempGroup.baseWorldBind.coordinate.Distance * Math.sin( tempBasePhi );
					const tempBaseWorldX = tempBaseIcon.worldPosition.x + tempBaseDX;
					const tempBaseWorldY = tempBaseIcon.worldPosition.y + tempBaseDY;

					// Spotter origin
					let tempSpotterOriginX: number;
					let tempSpotterOriginY: number;

					if ( tempGroup.spotterWorldBind.Icon != null )
					{
						const tempSpotterIcon = tempGroup.spotterWorldBind.Icon!;
						const tempSpotterPhi = MathUtility.GetCompassToRadians( tempGroup.spotterWorldBind.coordinate.Angle );
						const tempSpotterDX = tempGroup.spotterWorldBind.coordinate.Distance * Math.cos( tempSpotterPhi );
						const tempSpotterDY = tempGroup.spotterWorldBind.coordinate.Distance * Math.sin( tempSpotterPhi );
						tempSpotterOriginX = tempSpotterIcon.worldPosition.x + tempSpotterDX;
						tempSpotterOriginY = tempSpotterIcon.worldPosition.y + tempSpotterDY;
					}
					else
					{
						tempSpotterOriginX = tempBaseWorldX;
						tempSpotterOriginY = tempBaseWorldY;
					}

					// Spotter chain
					let sx = tempSpotterOriginX;
					let sy = tempSpotterOriginY;

					for ( let j = 0; j < tempGroup.spotters.length; ++j )
					{
						const tempLeg = tempGroup.spotters[ j ];
						const tempPhi = MathUtility.GetCompassToRadians( tempLeg.Angle );
						const tempVX = tempLeg.Distance * Math.cos( tempPhi );
						const tempVY = tempLeg.Distance * Math.sin( tempPhi ); // vector S{i+1} -> S{i}

						const nx = sx - tempVX;
						const ny = sy - tempVY;

						const a = WorldToPixel( { x: sx, y: sy } );
						const b = WorldToPixel( { x: nx, y: ny } );

						tContext.save();
						tempLineRed();
						tContext.lineCap = "round";
						tempDrawLine( a.x, a.y, b.x, b.y );
						tContext.restore();

						sx = nx;
						sy = ny;
					}

					// Compute target world from last spotter
					let tempLastSpotterX = tempSpotterOriginX;
					let tempLastSpotterY = tempSpotterOriginY;

					for ( let j = tempGroup.spotters.length - 1; j >= 0; --j )
					{
						const tempLeg = tempGroup.spotters[ j ];
						const tempPhi = MathUtility.GetCompassToRadians( tempLeg.Angle );
						const tempVX = tempLeg.Distance * Math.cos( tempPhi );
						const tempVY = tempLeg.Distance * Math.sin( tempPhi );
						tempLastSpotterX -= tempVX;
						tempLastSpotterY -= tempVY;
					}

					const tempPhiTarget = MathUtility.GetCompassToRadians( tempGroup.ActiveTarget?.coordinate.Angle ?? 0 );
					const tempTargetDistance = tempGroup.ActiveTarget?.coordinate.Distance ?? 0;
					const tempTargetWorldX = tempLastSpotterX + tempTargetDistance * Math.cos( tempPhiTarget );
					const tempTargetWorldY = tempLastSpotterY + tempTargetDistance * Math.sin( tempPhiTarget );

					// Guns
					for ( let j = tempGroup.guns.length - 1; j >= 0; --j )
					{
						const tempGun = tempGroup.guns[ j ];
						const tempPhiGun = MathUtility.GetCompassToRadians( tempGun.location.Angle );
						const tempGunWorldX = tempBaseWorldX + tempGun.location.Distance * Math.cos( tempPhiGun );
						const tempGunWorldY = tempBaseWorldY + tempGun.location.Distance * Math.sin( tempPhiGun );

						const pBase = WorldToPixel( { x: tempBaseWorldX, y: tempBaseWorldY } );
						const pGun  = WorldToPixel( { x: tempGunWorldX, y: tempGunWorldY } );
						const pTgt  = WorldToPixel( { x: tempTargetWorldX, y: tempTargetWorldY } );

						// Base -> Gun
						tContext.save();
						tContext.lineCap = "round";
						tempLineBlue();
						tempDrawLine( pBase.x, pBase.y, pGun.x, pGun.y );
						tContext.restore();

						// Gun -> Target
						tContext.save();
						tContext.lineCap = "round";
						tempLineGreenDashed();
						tempDrawLine( pGun.x, pGun.y, pTgt.x, pTgt.y );
						tContext.restore();
					}

					// Target marker
					{
						const pTgt = WorldToPixel( { x: tempTargetWorldX, y: tempTargetWorldY } );
						tempDrawX( pTgt.x, pTgt.y, tempPx( 10 ) );
					}
				}
			}
		}

		function Draw()
		{
			const tempCanvas = tempCanvasRef.current;

			if ( tempCanvas != null )
			{
				const tempContext = tempCanvas.getContext( "2d" )!;
				const tempDPR = window.devicePixelRatio || 1;

				// Reset to device pixels and clear
				tempContext.setTransform( 1, 0, 0, 1, 0, 0 );
				tempContext.clearRect( 0, 0, tempCanvas.width, tempCanvas.height );
				tempContext.scale( tempDPR, tempDPR );

				// Apply world transform
				const tempZoom = tempApp.map.Zoom > 0 ? tempApp.map.Zoom : 0.6;
				tempContext.translate( tempApp.map.X, tempApp.map.Y );
				tempContext.scale( tempZoom, tempZoom );

				// World background
				tempContext.fillStyle = "#09090b"; // bg-zinc-950
				tempContext.fillRect( -1e6, -1e6, 2e6, 2e6 );

				// Tiles
				for ( let i = 0; i < tempApp.map.tiles.length; ++i )
				{
					const tempTile = tempApp.map.tiles[ i ];
					const tempURL = `/tiles/${tempTile.key}.png`;
					const tempImage = CACHE.LoadImage( tempURL, () => { tempNeedsRenderRef.current = true; QueueRender(); } );

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

				// Grid
				DrawGrid( tempContext );

				// Outline
				tempContext.save();
				tempContext.lineWidth = 1.25 / tempZoom;
				tempContext.strokeStyle = "rgba(255,255,255,0.5)";

				for ( let i = tempApp.map.tiles.length - 1; i >= 0; --i )
				{
					const tempTile = tempApp.map.tiles[ i ];
					const tempPointsLength = tempTile.outline.length;
					tempContext.beginPath();
					tempContext.moveTo( tempTile.outline[ 0 ].x, tempTile.outline[ 0 ].y );

					for ( let j = 1; j < tempPointsLength; ++j )
					{
						tempContext.lineTo( tempTile.outline[ j ].x, tempTile.outline[ j ].y );
					}

					tempContext.closePath();
					tempContext.stroke();
				}
				tempContext.restore();

				// Icons
				tempIconHitsRef.current = [];
				DrawIcons( tempContext, tempZoom );
				DrawFireGroups( tempContext, tempZoom );
			}
		}

		function DrawGrid( tContext: CanvasRenderingContext2D )
		{
			const tempTiles = tempApp.map.tiles;

			if ( tempTiles.length > 0 )
			{
				const tempTile = tempTiles[ 0 ];
				const tempPxPerMeterX = tempTile.rectangle.Width / ( MAX_X_M - MIN_X_M );
				const tempPxPerMeterY = tempTile.rectangle.Height / ( MAX_Y_M - MIN_Y_M );
				const tempCellWidth = 125 * tempPxPerMeterX; // 125m
				const tempCellHeight = 125 * tempPxPerMeterY;

				const tempOriginTile = tempTiles.find( x => x.axial.q === 0 && x.axial.r === 0 ) ?? tempTile;
				const tempAnchorX = tempOriginTile.position.x;
				const tempAnchorY = tempOriginTile.position.y;

				const tempBounds = tempApp.map.WorldBounds;
				const tempStartX = tempAnchorX + Math.floor( ( tempBounds.left - tempAnchorX ) / tempCellWidth ) * tempCellWidth;
				const tempStartY = tempAnchorY + Math.floor( ( tempBounds.top - tempAnchorY ) / tempCellHeight ) * tempCellHeight;

				const tempZoom = Math.max( 0.001, tempApp.map.Zoom );
				tContext.save();
				tContext.lineWidth = 0.75 / tempZoom;
				tContext.strokeStyle = "rgba(23,23,23,0.5)";

				for ( let x = tempStartX; x <= tempBounds.right; x += tempCellWidth )
				{
					tContext.beginPath();
					tContext.moveTo( x, tempBounds.top );
					tContext.lineTo( x, tempBounds.bottom );
					tContext.stroke();
				}

				for ( let y = tempStartY; y <= tempBounds.bottom; y += tempCellHeight )
				{
					tContext.beginPath();
					tContext.moveTo( tempBounds.left, y );
					tContext.lineTo( tempBounds.right, y );
					tContext.stroke();
				}

				tContext.restore();
			}
		}

		function DrawIcons( tContext: CanvasRenderingContext2D, tZoom: number )
		{
			const tempTiles = tempApp.map.tiles;
			const tempIconSize = Math.min( 30, 125 * Math.pow( 1 / Math.max( tZoom, 0.001 ), 1 ) );
			const tempWorldSize = tempIconSize / tZoom;
			const tempHalf = tempWorldSize / 2;

			for ( let i = tempTiles.length - 1; i >= 0; --i )
			{
				const tempTile = tempTiles[ i ];
				const tempIcons = tempTile.icons;

				for ( let j = tempIcons.length - 1; j >= 0; --j )
				{
					// Load image
					const tempIcon = tempIcons[ j ];
					const tempURL = `/icons/${tempIcon.type}.png`;
					const tempBase = CACHE.LoadImage(
						tempURL,
						() =>
						{
							tempNeedsRenderRef.current = true;
							QueueRender();
						}
					);

					// Render
					if ( tempBase.complete && tempBase.naturalWidth !== 0 )
					{
						const tempTinted = CACHE.LoadIcon( tempBase, tempIcon );
						tContext.imageSmoothingEnabled = true;
						tContext.drawImage( tempTinted, tempIcon.pixelPosition.x - tempHalf, tempIcon.pixelPosition.y - tempHalf, tempWorldSize, tempWorldSize );

						tempIconHitsRef.current.push( new IconHit( tempTile, tempIcon, tempHalf ) );
					}
				}
			}
		}

		// Render
		React.useEffect(
			() =>
			{
				tempNeedsRenderRef.current = true;
				QueueRender();
			}
		);

		const tempCanvasStyle: React.CSSProperties =
		{
			position: "absolute",
			inset: 0,
			touchAction: "none",
			userSelect: "none",
			WebkitUserSelect: "none",
			WebkitTapHighlightColor: "transparent"
		};

		let tempClass = "relative h-full w-full overflow-hidden bg-neutral-900 overscroll-contain";

		if ( tempApp.IsSelectingMapIcon )
		{
			tempClass += " cursor-crosshair";
		}

		return (
			<div
				ref={ tempWrapRef }
				className={ tempClass }
				onPointerDown={ tempOnPointerDown }
				onPointerMove={ tempOnPointerMove }
				onPointerUp={ tempOnPointerUp }
				onClick={ tempOnClick }
			>
				<button
					className="absolute right-3 top-3 z-10 rounded-md border border-white/10 bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-800"
					onClick={ tempOnUpdateClick }
					onPointerDown={ ( e ) => e.stopPropagation() }
					disabled={ isUpdating }
				>
					{ isUpdating ? "Updating…" : "Update" }
				</button>

				<canvas ref={ tempCanvasRef} style={ tempCanvasStyle }/>
			</div>
		);
	}
);

function reaction(arg0: () => unknown[], arg1: () => void, arg2: { equals: any; }) {
    throw new Error("Function not implemented.");
}
