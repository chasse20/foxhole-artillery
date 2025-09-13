import React from "react";
import { useApp } from "../AppContext.tsx";
import { observer } from "mobx-react-lite";
import { Tile } from "./Tile.tsx";
import { MAX_X_M, MAX_Y_M, MIN_X_M, MIN_Y_M } from "../../Model/Map/Tile.ts";

// flat-top hex outline (your tile.center is worldPosition)
function HexPathD( t:{ cx:number; cy:number; r:number } )
{
	const h = Math.sqrt( 3 ) * t.r;
	return [
		`M ${t.cx - t.r / 2} ${t.cy - h / 2}`,
		`L ${t.cx + t.r / 2} ${t.cy - h / 2}`,
		`L ${t.cx + t.r} ${t.cy}`,
		`L ${t.cx + t.r / 2} ${t.cy + h / 2}`,
		`L ${t.cx - t.r / 2} ${t.cy + h / 2}`,
		`L ${t.cx - t.r} ${t.cy}`,
		`Z`
	].join( " " );
}

// one lightweight SVG overlay: 125m grid (pattern) + hex borders
function WorldOverlay( { map }:{ map: ReturnType<typeof useApp>["map"] } )
{
	// pick any tile (all share same pixel size) to compute px-per-unit
	const t0 = map.tiles[ 0 ];
	const TILE_U_W = MAX_X_M - MIN_X_M; // 218400
	const TILE_U_H = MAX_Y_M - MIN_Y_M; // 189000
	const sx = t0.rectangle.Width  / TILE_U_W;
	const sy = t0.rectangle.Height / TILE_U_H;

	// anchor grid at world (0,0)
	const originTile = map.tiles.find( t => t.axial.q === 0 && t.axial.r === 0 ) ?? t0;
	const px0x = originTile.position.x;
	const px0y = originTile.position.y;

	const tempGridSpace = 125; // meters
	const cellW = tempGridSpace * sx;
	const cellH = tempGridSpace * sy;

	const b = map.WorldBounds;
	const style: React.CSSProperties =
	{
		position: "absolute",
		left: `${b.left}px`,
		top: `${b.top}px`,
		width: `${b.Width}px`,
		height: `${b.Height}px`,
		pointerEvents: "none"
	};

	return (
		<svg style={style} viewBox={`${b.left} ${b.top} ${b.Width} ${b.Height}`}>
			<defs>
				<pattern
					id="wm-grid"
					patternUnits="userSpaceOnUse"
					width={cellW}
					height={cellH}
					patternTransform={`translate(${px0x} ${px0y})`}
				>
					<path
						d={`M ${cellW} 0 H 0 M 0 0 V ${cellH}`}
						stroke="#171717"
						strokeOpacity="0.5"
						strokeWidth="0.5"
						vectorEffect="non-scaling-stroke"
					/>
				</pattern>
			</defs>

			<rect x={b.left} y={b.top} width={b.Width} height={b.Height} fill="url(#wm-grid)"/>

			<g stroke="#fff" strokeOpacity="0.5" fill="none" vectorEffect="non-scaling-stroke">
				{map.tiles.map( t => (
					<path key={`hex-${t.key}`} d={HexPathD( { cx: t.position.x, cy: t.position.y, r: t.radius } )} strokeWidth="4" />
				) )}
			</g>
		</svg>
	);
}

type CSSVars = { [ "--wm-icon-scale" ]?: number | string };

export const WorldMap = observer(
	function WorldMap()
	{
		const tempApp = useApp();

		// transient "interacting" signal for conditional will-change
		const [ isInteracting, setIsInteracting ] = React.useState( false );
		const tempInteractRAF = React.useRef<number | null>( null );

		const touch = React.useCallback(
			() =>
			{
				if ( tempInteractRAF.current != null )
				{
					cancelAnimationFrame( tempInteractRAF.current );
					tempInteractRAF.current = null;
				}
				if ( !isInteracting ) setIsInteracting( true );
				tempInteractRAF.current = requestAnimationFrame( () =>
				{
					setIsInteracting( false );
					tempInteractRAF.current = null;
				} );
			},
			[ isInteracting ]
		);

		React.useEffect( () => () => { if ( tempInteractRAF.current != null ) cancelAnimationFrame( tempInteractRAF.current ); }, [] );

		// Pan (rAF-coalesced)
		const dragRef = React.useRef<{ x: number; y: number } | null>( null );
		const panDeltaRef = React.useRef( { dx: 0, dy: 0 } );
		const panRafRef = React.useRef<number | undefined>( undefined );

		const flushPan = () =>
		{
			const { dx, dy } = panDeltaRef.current;
			if ( dx || dy )
			{
				tempApp.map.X = tempApp.map.X + dx;
				tempApp.map.Y = tempApp.map.Y + dy;
				panDeltaRef.current = { dx: 0, dy: 0 };
			}
			panRafRef.current = undefined;
		};

		const onPointerDown = ( e: React.PointerEvent ) =>
		{
			if ( ( e.target as HTMLElement ).closest( '[data-marker="1"]' ) ) return;
			( e.currentTarget as Element ).setPointerCapture( e.pointerId );
			dragRef.current = { x: e.clientX, y: e.clientY };
			touch();
		};

		const onPointerMove = ( e: React.PointerEvent ) =>
		{
			const d = dragRef.current; if ( !d ) return;
			const dx = e.clientX - d.x, dy = e.clientY - d.y;
			dragRef.current = { x: e.clientX, y: e.clientY };
			panDeltaRef.current.dx += dx;
			panDeltaRef.current.dy += dy;
			if ( panRafRef.current == null ) panRafRef.current = requestAnimationFrame( flushPan );
			touch();
		};

		const endPan = ( e: React.PointerEvent ) =>
		{
			dragRef.current = null;
			( e.currentTarget as Element ).releasePointerCapture( e.pointerId );
			if ( panRafRef.current != null )
			{
				cancelAnimationFrame( panRafRef.current );
				flushPan();
			}
			touch();
		};

		const onPointerUp = endPan;
		const onPointerCancel = endPan;
		const onPointerLeave = endPan;

		// Zoom (native listener with passive:false; rAF-coalesced)
		const tempWrapRef = React.useRef<HTMLDivElement | null>( null );

		React.useEffect( () =>
		{
			const el = tempWrapRef.current; if ( !el ) return;
			let queued = false;

			const onWheel = ( e: WheelEvent ) =>
			{
				e.preventDefault();
				const r = el.getBoundingClientRect();
				const cx = e.clientX - r.left;
				const cy = e.clientY - r.top;
				const k = Math.exp( -e.deltaY * 0.0015 );

				const apply = () =>
				{
					const oldZ = tempApp.map.Zoom > 0 ? tempApp.map.Zoom : 0.6;
					const newZ = Math.min( 5, Math.max( 0.1, oldZ * k ) );
					const s = newZ / oldZ;
					tempApp.map.X = cx - s * ( cx - tempApp.map.X );
					tempApp.map.Y = cy - s * ( cy - tempApp.map.Y );
					tempApp.map.Zoom = newZ;
					queued = false;
				};

				if ( !queued )
				{
					queued = true;
					requestAnimationFrame( apply );
				}

				touch();
			};

			el.addEventListener( "wheel", onWheel, { passive: false } );
			return () => el.removeEventListener( "wheel", onWheel );
		}, [ tempApp.map, touch ] );

		// Update
		const [ tempUpdating, setTempUpdating ] = React.useState( false );
		const onUpdateClick = React.useCallback(
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
				}
			},
			[ tempApp, tempUpdating ]
		);

		// Transform from model
		const tempIconScale = Math.min( 4, 1.2 / tempApp.map.Zoom );

		const style: React.CSSProperties & CSSVars =
		{
			position: "absolute",
			inset: 0,
			transformOrigin: "0 0",
			transform: `translate(${tempApp.map.X}px, ${tempApp.map.Y}px) scale(${tempApp.map.Zoom})`,
			willChange: isInteracting ? "transform" : undefined,
			userSelect: "none",
			WebkitUserSelect: "none",
			WebkitTapHighlightColor: "transparent",
			touchAction: "none",
			[ "--wm-icon-scale" ]: String( tempIconScale )
		};

		return (
			<div
				ref={tempWrapRef}
				className="relative h-full w-full overflow-hidden bg-neutral-900 overscroll-contain"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerCancel}
				onPointerLeave={onPointerLeave}
				onDragStart={ e => e.preventDefault() }
				onMouseDown={ e => e.preventDefault() } // suppresses native selection on long drags
				onContextMenu={ e => e.preventDefault() } // avoid context menu during panning
			>
				<button
					className="absolute right-3 top-3 z-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-60"
					onClick={onUpdateClick}
					onPointerDown={ e => e.stopPropagation() } // don't start a pan
					disabled={tempUpdating}
				>
					{ tempUpdating ? "Updating…" : "Update" }
				</button>

				<div style={style}>
					{tempApp.map.tiles.map( t => <Tile key={t.key} tile={t} /> )}
					<WorldOverlay map={tempApp.map}/>
				</div>
			</div>
		);
	}
);
