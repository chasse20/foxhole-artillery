import React from "react";
import { observer } from "mobx-react-lite";
import WorldMapModel from "../../Model/Map/WorldMap";
import { TeamType } from "../../Model/Map/TeamType";

const gIconImages = new Map<string, HTMLImageElement>();
const gTintCache = new Map<string, HTMLCanvasElement>();

export const IconLayer = observer(
	function IconLayer( { map }: { map: WorldMapModel } )
	{
		// access to make MobX track renders
		const tempX = map.X; const tempY = map.Y; const tempZ = map.Zoom;

		const tempCanvasRef = React.useRef<HTMLCanvasElement | null>( null );
		const [ tempTick, setTempTick ] = React.useState<number>( 0 );

		function ResizeToParent()
		{
			const tempCanvas = tempCanvasRef.current;
			if ( tempCanvas == null || tempCanvas.parentElement == null ) return;

			const tempRect = tempCanvas.parentElement.getBoundingClientRect();
			const tempDPR = Math.min( 3, window.devicePixelRatio || 1 );

			tempCanvas.style.position = "absolute";
			tempCanvas.style.inset = "0";
			tempCanvas.style.pointerEvents = "none"; // turn on when you add hit-testing
			tempCanvas.style.userSelect = "none";
			tempCanvas.style.setProperty( "-webkit-user-select", "none" );

			tempCanvas.style.width = `${tempRect.width}px`;
			tempCanvas.style.height = `${tempRect.height}px`;
			tempCanvas.width = Math.max( 1, Math.floor( tempRect.width  * tempDPR ) );
			tempCanvas.height = Math.max( 1, Math.floor( tempRect.height * tempDPR ) );
		}

		function LoadIcon( tType: number ): HTMLImageElement
		{
			const tempSrc = `/icons/${tType}.png`;
			const tempExisting = gIconImages.get( tempSrc );
			if ( tempExisting != null ) return tempExisting;

			const tempImage = new Image();
			tempImage.decoding = "async";
			tempImage.loading = "eager";
			tempImage.crossOrigin = "anonymous";
			tempImage.src = tempSrc;
			tempImage.addEventListener(
				"load",
				() => setTempTick( v => v + 1 ),
				{ once: true }
			);
			gIconImages.set( tempSrc, tempImage );
			return tempImage;
		}

		function GetTeamColor( tTeam: TeamType ): { r: number; g: number; b: number }
		{
			if ( tTeam === TeamType.Warden ) return { r: 21, g: 38, b: 18 };
			if ( tTeam === TeamType.Colonial ) return { r: 4, g: 23, b: 57 };
			return { r: 255, g: 255, b: 255 };
		}

		function GetTintedIcon( tBase: HTMLImageElement, tTeam: TeamType ): HTMLCanvasElement
		{
			const tempColor = GetTeamColor( tTeam );
			const tempKey = `${tBase.src}|${tempColor.r},${tempColor.g},${tempColor.b}`;
			const tempExisting = gTintCache.get( tempKey );
			if ( tempExisting != null ) return tempExisting;

			const tempCanvas = document.createElement( "canvas" );
			const tempW = Math.max( 1, tBase.naturalWidth );
			const tempH = Math.max( 1, tBase.naturalHeight );
			tempCanvas.width = tempW;
			tempCanvas.height = tempH;

			const tempContext = tempCanvas.getContext( "2d" );
			if ( tempContext != null )
			{
				// base sprite
				tempContext.globalCompositeOperation = "source-over";
				tempContext.clearRect( 0, 0, tempW, tempH );
				tempContext.drawImage( tBase, 0, 0, tempW, tempH );

				// multiply tint (white takes the color)
				tempContext.globalCompositeOperation = "multiply";
				tempContext.fillStyle = `rgb(${tempColor.r},${tempColor.g},${tempColor.b})`;
				tempContext.fillRect( 0, 0, tempW, tempH );

				// keep original alpha
				tempContext.globalCompositeOperation = "destination-in";
				tempContext.drawImage( tBase, 0, 0, tempW, tempH );
			}

			gTintCache.set( tempKey, tempCanvas );
			return tempCanvas;
		}

		function GetIconScreenSize( tZoom: number ): number
		{
			const tempBase = 28;
			const tempSize = tempBase / Math.sqrt( Math.max( tZoom, 0.001 ) );
			return Math.min( 44, Math.max( 16, tempSize ) );
		}

		function Draw()
		{
			const tempCanvas = tempCanvasRef.current; if ( tempCanvas == null ) return;
			const tempContext = tempCanvas.getContext( "2d" ); if ( tempContext == null ) return;

			const tempDPR = Math.min( 3, window.devicePixelRatio || 1 );
			const tempZoom = Math.max( 0.001, map.Zoom );

			// reset + clear
			tempContext.setTransform( 1, 0, 0, 1, 0, 0 );
			tempContext.clearRect( 0, 0, tempCanvas.width, tempCanvas.height );

			// CSS pixel space
			tempContext.scale( tempDPR, tempDPR );

			// world transform
			tempContext.translate( map.X, map.Y );
			tempContext.scale( tempZoom, tempZoom );

			// cull against current view in world space
			const tempCanvasCssW = tempCanvas.width / tempDPR;
			const tempCanvasCssH = tempCanvas.height / tempDPR;
			const tempViewLeft = -map.X / tempZoom;
			const tempViewTop  = -map.Y / tempZoom;
			const tempViewRight = tempViewLeft + ( tempCanvasCssW / tempZoom );
			const tempViewBottom = tempViewTop + ( tempCanvasCssH / tempZoom );

			// icon sizing: choose screen size, convert to world size
			const tempScreenSize = GetIconScreenSize( tempZoom );
			const tempWorldSize = tempScreenSize / tempZoom;
			const tempHalf = tempWorldSize / 2;

			for ( let i = 0; i < map.tiles.length; ++i )
			{
				const tempTile = map.tiles[ i ];
				for ( let j = 0; j < tempTile.icons.length; ++j )
				{
					const tempIcon = tempTile.icons[ j ];

					const tempPX = tempTile.rectangle.left + tempTile.rectangle.Width  * tempIcon.position.x;
					const tempPY = tempTile.rectangle.top  + tempTile.rectangle.Height * tempIcon.position.y;

					// cull
					if ( tempPX + tempHalf < tempViewLeft || tempPX - tempHalf > tempViewRight ||
						 tempPY + tempHalf < tempViewTop  || tempPY - tempHalf > tempViewBottom )
					{
						continue;
					}

					const tempBase = LoadIcon( tempIcon.type );
					if ( !( tempBase.complete && tempBase.naturalWidth > 0 ) ) continue;

					const tempTinted = GetTintedIcon( tempBase, tempIcon.team );

					tempContext.imageSmoothingEnabled = true;
					tempContext.drawImage(
						tempTinted,
						tempPX - tempHalf,
						tempPY - tempHalf,
						tempWorldSize,
						tempWorldSize
					);
				}
			}
		}

		React.useEffect(
			() =>
			{
				ResizeToParent();
				Draw();

				const tempCanvas = tempCanvasRef.current;
				if ( tempCanvas != null && tempCanvas.parentElement != null )
				{
					const tempObserver = new ResizeObserver(
						() =>
						{
							ResizeToParent();
							Draw();
						}
					);
					tempObserver.observe( tempCanvas.parentElement );
					return () => tempObserver.disconnect();
				}
			},
			// redraw on pan/zoom/icon image loads
			[ tempX, tempY, tempZ, tempTick, map.tiles.length ]
		);

		return <canvas ref={tempCanvasRef}/>;
	}
);
