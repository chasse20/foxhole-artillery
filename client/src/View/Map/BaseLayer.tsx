import React from "react";
import { observer } from "mobx-react-lite";
import WorldMapModel from "../../Model/Map/WorldMap";
import { MIN_X_M, MAX_X_M, MIN_Y_M, MAX_Y_M } from "../../Model/Map/Tile";

const gTileImages = new Map<string, HTMLImageElement>();

export const BaseLayer = observer(
	function BaseLayer( { map }: { map: WorldMapModel } )
	{
		const tempCanvasRef = React.useRef<HTMLCanvasElement | null>( null );
		const [ tempTick, setTempTick ] = React.useState<number>( 0 );

		const tempX = map.X;
		const tempY = map.Y;
		const tempZ = map.Zoom;

		function ResizeToParent()
		{
			const tempCanvas = tempCanvasRef.current;
			if ( tempCanvas == null || tempCanvas.parentElement == null ) return;

			const tempRect = tempCanvas.parentElement.getBoundingClientRect();
			const tempDPR = Math.min( 3, window.devicePixelRatio || 1 );

			tempCanvas.style.position = "absolute";
			tempCanvas.style.inset = "0";
			tempCanvas.style.pointerEvents = "none";

			tempCanvas.style.width = `${tempRect.width}px`;
			tempCanvas.style.height = `${tempRect.height}px`;
			tempCanvas.width = Math.max( 1, Math.floor( tempRect.width  * tempDPR ) );
			tempCanvas.height = Math.max( 1, Math.floor( tempRect.height * tempDPR ) );
		}

		function LoadImage( tSrc: string ): HTMLImageElement
		{
			const tempExisting = gTileImages.get( tSrc );
			if ( tempExisting != null ) return tempExisting;

			const tempImage = new Image();
			tempImage.decoding = "async";
			tempImage.loading = "eager";
			tempImage.crossOrigin = "anonymous";
			tempImage.src = tSrc;
			tempImage.addEventListener(
				"load",
				() => setTempTick( v => v + 1 ),
				{ once: true }
			);
			gTileImages.set( tSrc, tempImage );
			return tempImage;
		}

		function Draw()
		{
			const tempCanvas = tempCanvasRef.current; if ( tempCanvas == null ) return;
			const tempContext = tempCanvas.getContext( "2d" ); if ( tempContext == null ) return;

			const tempDPR = Math.min( 3, window.devicePixelRatio || 1 );

			// reset + clear
			tempContext.setTransform( 1, 0, 0, 1, 0, 0 );
			tempContext.clearRect( 0, 0, tempCanvas.width, tempCanvas.height );

			// CSS pixel space
			tempContext.scale( tempDPR, tempDPR );

			// world transform
			const tempZoom = Math.max( 0.001, map.Zoom );
			tempContext.translate( map.X, map.Y );
			tempContext.scale( tempZoom, tempZoom );

			// tiles
			for ( let i = 0; i < map.tiles.length; ++i )
			{
				const tempTile = map.tiles[ i ];
				const tempSrc = `/tiles/${tempTile.key}.png`;
				const tempImage = LoadImage( tempSrc );

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
					// placeholder
					tempContext.fillStyle = "#0b0f19";
					tempContext.fillRect(
						tempTile.rectangle.left,
						tempTile.rectangle.top,
						tempTile.rectangle.Width,
						tempTile.rectangle.Height
					);
				}
			}

			// grid (125m)
			DrawGrid( tempContext, map );

			// hex borders (non-scaling stroke)
			tempContext.save();
			tempContext.lineWidth = 1.25 / tempZoom;
			tempContext.strokeStyle = "rgba(255,255,255,0.5)";

			for ( let i = 0; i < map.tiles.length; ++i )
			{
				const tempTile = map.tiles[ i ];
				const tempR = tempTile.radius;
				const tempH = Math.sqrt( 3 ) * tempR;
				const tempCX = tempTile.position.x;
				const tempCY = tempTile.position.y;

				tempContext.beginPath();
				tempContext.moveTo( tempCX - tempR / 2, tempCY - tempH / 2 );
				tempContext.lineTo( tempCX + tempR / 2, tempCY - tempH / 2 );
				tempContext.lineTo( tempCX + tempR,     tempCY );
				tempContext.lineTo( tempCX + tempR / 2, tempCY + tempH / 2 );
				tempContext.lineTo( tempCX - tempR / 2, tempCY + tempH / 2 );
				tempContext.lineTo( tempCX - tempR,     tempCY );
				tempContext.closePath();
				tempContext.stroke();
			}

			tempContext.restore();
		}

		function DrawGrid( tContext: CanvasRenderingContext2D, tMap: WorldMapModel )
		{
			if ( tMap.tiles.length === 0 ) return;

			const tempTile0 = tMap.tiles[ 0 ];
			const tempMetersW = ( MAX_X_M - MIN_X_M );
			const tempMetersH = ( MAX_Y_M - MIN_Y_M );
			const tempPxPerMeterX = tempTile0.rectangle.Width  / tempMetersW;
			const tempPxPerMeterY = tempTile0.rectangle.Height / tempMetersH;

			const tempStepX = 125 * tempPxPerMeterX;
			const tempStepY = 125 * tempPxPerMeterY;

			const tempOrigin = tMap.tiles.find( t => t.axial.q === 0 && t.axial.r === 0 ) ?? tempTile0;
			const tempAnchorX = tempOrigin.position.x;
			const tempAnchorY = tempOrigin.position.y;

			const tempB = tMap.WorldBounds;
			const tempStartX = tempAnchorX + Math.floor( ( tempB.left - tempAnchorX ) / tempStepX ) * tempStepX;
			const tempStartY = tempAnchorY + Math.floor( ( tempB.top  - tempAnchorY ) / tempStepY ) * tempStepY;

			const tempZoom = Math.max( 0.001, tMap.Zoom );
			tContext.save();
			tContext.lineWidth = 0.75 / tempZoom;
			tContext.strokeStyle = "rgba(23,23,23,0.5)";

			for ( let x = tempStartX; x <= tempB.right; x += tempStepX )
			{
				tContext.beginPath();
				tContext.moveTo( x, tempB.top );
				tContext.lineTo( x, tempB.bottom );
				tContext.stroke();
			}

			for ( let y = tempStartY; y <= tempB.bottom; y += tempStepY )
			{
				tContext.beginPath();
				tContext.moveTo( tempB.left, y );
				tContext.lineTo( tempB.right, y );
				tContext.stroke();
			}

			tContext.restore();
		}

		// Render
		const tempDrawRef = React.useRef<() => void>( () => {} );
		tempDrawRef.current = Draw; // keep this outside of effects so it’s always the latest

		React.useEffect(
			() =>
			{
				ResizeToParent();
				tempDrawRef.current();

				const tempCanvas = tempCanvasRef.current;
				if ( tempCanvas != null && tempCanvas.parentElement != null )
				{
					const tempObserver = new ResizeObserver(
						() =>
						{
							ResizeToParent();
							tempDrawRef.current();
						}
					);
					tempObserver.observe( tempCanvas.parentElement );
					return () => tempObserver.disconnect();
				}
			},
			[] // subscribe once
		);

		React.useLayoutEffect(
			() =>
			{
				tempDrawRef.current();
			},
			[ tempX, tempY, tempZ, tempTick ]
		);

		return <canvas ref={tempCanvasRef}/>;
	}
);
