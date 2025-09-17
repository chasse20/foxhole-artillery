import React from "react";
import { useApp } from "../AppContext.tsx";
import { observer } from "mobx-react-lite";
import { MIN_X_M, MAX_X_M, MIN_Y_M, MAX_Y_M } from "../../Model/Map/Tile.ts";
import WorldMapCache from "./WorldMapCache.ts";
import IconHit from "./IconHit.ts";

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
						console.log( "Clicked icon", tempHit.tile.key, tempHit );
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

		// Draw
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

		return (
			<div
				ref={ tempWrapRef }
				className="relative h-full w-full overflow-hidden bg-neutral-900 overscroll-contain"
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
