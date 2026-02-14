import React from "react";
import { comparer, reaction as mobxReaction } from "mobx";
import type { IReactionDisposer } from "mobx";
import { observer } from "mobx-react";
import type App from "../../Model/App";
import { MIN_X_M, MAX_X_M, MIN_Y_M, MAX_Y_M } from "../../Model/Map/Tile";
import WorldMapCache from "./WorldMapCache";
import IconHit from "./IconHit";
import MathUtility from "../../Model/Utility/MathUtility";

const CACHE = new WorldMapCache();

const THEME =
{
	spotterStroke: "rgba(248, 113, 113, 0.9)",
	baseGunStroke: "rgb(48, 106, 221)",
	toTargetStroke: "rgba(74, 222, 128, 0.9)",
	targetRing: "rgba(134, 239, 172, 0.95)",
	targetFill: "rgba(134, 239, 172, 0.30)",
	rangeFill: "rgba(96, 165, 250, 0.10)",
	rangeRing: "rgba(96, 165, 250, 0.55)",
	dispersionFill: "rgba(253, 224, 71, 0.18)",
	dispersionRing: "rgba(250, 204, 21, 0.85)",
	glow: "rgba(0,0,0,0.3)"
};

class WorldMapView extends React.PureComponent<{ app: App }, { isUpdating: boolean; uiNonce: number }>
{
	protected _app: App;

	protected _wrapRef: React.RefObject<HTMLDivElement | null> = React.createRef<HTMLDivElement>();
	protected _canvasRef: React.RefObject<HTMLCanvasElement | null> = React.createRef<HTMLCanvasElement>();
	protected _iconHits: IconHit[] = [];
	protected _animationId: number | null = null;
	protected _needsRender: boolean = true;
	protected _drag: { x: number; y: number } | null = null;
	protected _panDelta = { dx: 0, dy: 0 };
	protected _disposer: IReactionDisposer | null = null;
	protected _cleanupWheel: (() => void) | null = null;
	protected _cleanupResize: (() => void) | null = null;
	protected _wheelQueued: boolean = false;

	constructor( tProps: { app: App } )
	{
		super( tProps );
		this._app = tProps.app;
		this.state = { isUpdating: false, uiNonce: 0 };

		this.OnPointerDown = this.OnPointerDown.bind( this );
		this.OnPointerMove = this.OnPointerMove.bind( this );
		this.OnPointerUp = this.OnPointerUp.bind( this );
		this.OnClick = this.OnClick.bind( this );
		this.OnUpdateClick = this.OnUpdateClick.bind( this );

		this.QueueRender = this.QueueRender.bind( this );
		this.Draw = this.Draw.bind( this );
		this.DrawGrid = this.DrawGrid.bind( this );
		this.DrawIcons = this.DrawIcons.bind( this );
		this.DrawFireGroups = this.DrawFireGroups.bind( this );

		this.DrawCircle = this.DrawCircle.bind( this );
		this.DrawDonut = this.DrawDonut.bind( this );
		this.GetWorldToPixel = this.GetWorldToPixel.bind( this );
		this.GetPixelsPerMeter = this.GetPixelsPerMeter.bind( this );
		this.CreateReaction = this.CreateReaction.bind( this );
	}

	componentDidMount(): void
	{
		const tempElement = this._wrapRef.current;
		const tempCanvas = this._canvasRef.current;

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

				this._needsRender = true;
				this.QueueRender();
			};

			const tempObserver = new ResizeObserver( OnResize );
			tempObserver.observe( tempElement );
			OnResize();
			this._cleanupResize = () => { tempObserver.disconnect(); };

			const OnWheel = ( tEvent: WheelEvent ) =>
			{
				tEvent.preventDefault();

				const tempRect = tempElement.getBoundingClientRect();
				const tempClientX = tEvent.clientX - tempRect.left;
				const tempClientY = tEvent.clientY - tempRect.top;
				const tempK = Math.exp( -tEvent.deltaY * 0.0015 );

				if ( this._wheelQueued === false )
				{
					this._wheelQueued = true;

					requestAnimationFrame(
						() =>
						{
							const tempApp = this._app;
							const tempOldZ = tempApp.map.Zoom > 0 ? tempApp.map.Zoom : 0.6;
							const tempNewZ = Math.min( 5, Math.max( 0.1, tempOldZ * tempK ) );
							const tempS = tempNewZ / tempOldZ;

							tempApp.map.X = tempClientX - tempS * ( tempClientX - tempApp.map.X );
							tempApp.map.Y = tempClientY - tempS * ( tempClientY - tempApp.map.Y );
							tempApp.map.Zoom = tempNewZ;

							this._needsRender = true;
							this.QueueRender();
							this._wheelQueued = false;
						}
					);
				}
			};

			tempElement.addEventListener( "wheel", OnWheel, { passive: false } );
			this._cleanupWheel = () => { tempElement.removeEventListener( "wheel", OnWheel ); };

			this._disposer = this.CreateReaction();
		}

		this._needsRender = true;
		this.QueueRender();
	}

	componentDidUpdate( tPrevProps: { app: App } ): void
	{
		if ( tPrevProps.app !== this.props.app )
		{
			this._app = this.props.app;

			if ( this._disposer != null )
			{
				this._disposer();
				this._disposer = null;
			}

			this._disposer = this.CreateReaction();

			this._needsRender = true;
			this.QueueRender();
		}
	}

	componentWillUnmount(): void
	{
		if ( this._animationId != null )
		{
			cancelAnimationFrame( this._animationId );
			this._animationId = null;
		}

		if ( this._disposer != null )
		{
			this._disposer();
			this._disposer = null;
		}

		if ( this._cleanupWheel != null )
		{
			this._cleanupWheel();
			this._cleanupWheel = null;
		}

		if ( this._cleanupResize != null )
		{
			this._cleanupResize();
			this._cleanupResize = null;
		}
	}

	CreateReaction(): IReactionDisposer
	{
		const tempDisposer = mobxReaction(
			() =>
			{
				const tempApp = this._app;
				const temp: unknown[] = [];

				for ( let i = 0; i < tempApp.fireGroups.length; ++i )
				{
					const tempGroup = tempApp.fireGroups[ i ];

					temp.push( tempGroup.IsVisible );
					temp.push( tempGroup.wind.Angle, tempGroup.wind.Strength );

					temp.push( tempGroup.baseWorldBind.Icon );
					temp.push( tempGroup.baseWorldBind.coordinate.Distance, tempGroup.baseWorldBind.coordinate.Angle );

					temp.push( tempGroup.spotterWorldBind.Icon );
					temp.push( tempGroup.spotterWorldBind.coordinate.Distance, tempGroup.spotterWorldBind.coordinate.Angle );

					temp.push( tempGroup.spotters.length );
					
					for ( let s = 0; s < tempGroup.spotters.length; ++s )
					{
						const tempLeg = tempGroup.spotters[ s ];
						temp.push( tempLeg.Distance, tempLeg.Angle );
					}

					temp.push( tempGroup.ActiveTarget );
					temp.push( tempGroup.ActiveTarget?.coordinate.Distance ?? 0 );
					temp.push( tempGroup.ActiveTarget?.coordinate.Angle ?? 0 );

					temp.push( tempGroup.guns.length );
					for ( let j = 0; j < tempGroup.guns.length; ++j )
					{
						const tempGun = tempGroup.guns[ j ];
						temp.push( tempGun.Name, tempGun.location.Distance, tempGun.location.Angle, tempGun.Type, tempGun.AimRadius );
					}
				}

				temp.push( tempApp.map.X, tempApp.map.Y, tempApp.map.Zoom );
				temp.push( tempApp.IsSelectingMapIcon );

				return temp;
			},
			() =>
			{
				this._needsRender = true;
				this.QueueRender();
			},
			{ equals: comparer.structural }
		);

		return tempDisposer;
	}

	QueueRender(): void
	{
		if ( this._animationId == null )
		{
			this._animationId = requestAnimationFrame(
				() =>
				{
					this._animationId = null;

					if ( this._needsRender )
					{
						this._needsRender = false;
						this.Draw();
					}
				}
			);
		}
	}

	OnPointerDown( tEvent: React.PointerEvent ): void
	{
		const tempTarget = tEvent.currentTarget as Element;
		tempTarget.setPointerCapture( tEvent.pointerId );
		this._drag = { x: tEvent.clientX, y: tEvent.clientY };
	}

	OnPointerMove( tEvent: React.PointerEvent ): void
	{
		const tempDrag = this._drag;

		if ( tempDrag != null )
		{
			const tempDx = tEvent.clientX - tempDrag.x;
			const tempDy = tEvent.clientY - tempDrag.y;
			this._drag = { x: tEvent.clientX, y: tEvent.clientY };

			this._panDelta.dx += tempDx;
			this._panDelta.dy += tempDy;

			if ( this._animationId == null )
			{
				this._animationId = requestAnimationFrame(
					() =>
					{
						this._animationId = null;
						const tempDx2 = this._panDelta.dx;
						const tempDy2 = this._panDelta.dy;

						if ( tempDx2 !== 0 || tempDy2 !== 0 )
						{
							const tempApp = this._app;
							tempApp.map.X = tempApp.map.X + tempDx2;
							tempApp.map.Y = tempApp.map.Y + tempDy2;
							this._panDelta = { dx: 0, dy: 0 };

							this._needsRender = true;
							this.QueueRender();
						}
					}
				);
			}
		}
	}

	OnPointerUp( tEvent: React.PointerEvent ): void
	{
		this._drag = null;
		const tempTarget = tEvent.currentTarget as Element;
		tempTarget.releasePointerCapture( tEvent.pointerId );
	}

	OnClick( tEvent: React.MouseEvent ): void
	{
		const tempCanvas = this._canvasRef.current;

		if ( tempCanvas != null )
		{
			const tempRect = tempCanvas.getBoundingClientRect();
			const tempApp = this._app;

			const tempScreenX = tEvent.clientX - tempRect.left;
			const tempScreenY = tEvent.clientY - tempRect.top;
			const tempZoom = tempApp.map.Zoom > 0 ? tempApp.map.Zoom : 0.6;
			const tempWorldX = ( tempScreenX - tempApp.map.X ) / tempZoom;
			const tempWorldY = ( tempScreenY - tempApp.map.Y ) / tempZoom;

			const tempHits = this._iconHits;

			for ( let i = tempHits.length - 1; i >= 0; --i )
			{
				const tempHit = tempHits[ i ];

				if ( Math.abs( tempWorldX - tempHit.icon.pixelPosition.x ) <= tempHit.half && Math.abs( tempWorldY - tempHit.icon.pixelPosition.y ) <= tempHit.half )
				{
					tempApp.OnMapIconSelect( tempHit.icon );
					i = -1;
				}
			}
		}
	}

	async OnUpdateClick( _: React.MouseEvent ): Promise<void>
	{
		if ( this.state.isUpdating === false )
		{
			this.setState( { isUpdating: true } );

			try
			{
				await this._app.UpdateAsync();
			}
			finally
			{
				this.setState( { isUpdating: false } );
				this._needsRender = true;
				this.QueueRender();
			}
		}
	}

	Draw(): void
	{
		const tempCanvas = this._canvasRef.current;

		if ( tempCanvas != null )
		{
			const tempContext = tempCanvas.getContext( "2d" );

			if ( tempContext != null )
			{
				const tempDPR = window.devicePixelRatio || 1;

				tempContext.setTransform( 1, 0, 0, 1, 0, 0 );
				tempContext.clearRect( 0, 0, tempCanvas.width, tempCanvas.height );
				tempContext.scale( tempDPR, tempDPR );

				const tempApp = this._app;
				const tempZoom = tempApp.map.Zoom > 0 ? tempApp.map.Zoom : 0.6;
				tempContext.translate( tempApp.map.X, tempApp.map.Y );
				tempContext.scale( tempZoom, tempZoom );

				tempContext.fillStyle = "#09090b";
				tempContext.fillRect( -1e6, -1e6, 2e6, 2e6 );

				for ( let i = 0; i < tempApp.map.tiles.length; ++i )
				{
					const tempTile = tempApp.map.tiles[ i ];
					const tempURL = `/tiles/${tempTile.key}.png`;
					const tempImage = CACHE.LoadImage(
						tempURL,
						() =>
						{
							this._needsRender = true;
							this.QueueRender();
						}
					);

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

				this.DrawGrid( tempContext );

				tempContext.save();
				tempContext.lineWidth = 1.25 / ( tempZoom > 0 ? tempZoom : 0.6 );
				tempContext.strokeStyle = "rgba(255,255,255,0.5)";

				for ( let i = this._app.map.tiles.length - 1; i >= 0; --i )
				{
					const tempTile = this._app.map.tiles[ i ];
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

				this._iconHits = [];
				this.DrawIcons( tempContext, tempZoom );
				this.DrawFireGroups( tempContext, tempZoom );
			}
		}
	}

	DrawGrid( tContext: CanvasRenderingContext2D ): void
	{
		const tempTiles = this._app.map.tiles;

		if ( tempTiles.length > 0 )
		{
			const tempTile = tempTiles[ 0 ];
			const tempPxPerMeterX = tempTile.rectangle.Width / ( MAX_X_M - MIN_X_M );
			const tempPxPerMeterY = tempTile.rectangle.Height / ( MAX_Y_M - MIN_Y_M );
			const tempCellWidth = 125 * tempPxPerMeterX;
			const tempCellHeight = 125 * tempPxPerMeterY;

			const tempOriginTile = tempTiles.find( x => x.axial.q === 0 && x.axial.r === 0 ) ?? tempTile;
			const tempAnchorX = tempOriginTile.position.x;
			const tempAnchorY = tempOriginTile.position.y;

			const tempBounds = this._app.map.WorldBounds;
			const tempStartX = tempAnchorX + Math.floor( ( tempBounds.left - tempAnchorX ) / tempCellWidth ) * tempCellWidth;
			const tempStartY = tempAnchorY + Math.floor( ( tempBounds.top - tempAnchorY ) / tempCellHeight ) * tempCellHeight;

			const tempZoom = Math.max( 0.001, this._app.map.Zoom );
			tContext.save();
			tContext.lineWidth = 0.75 / tempZoom;
			tContext.strokeStyle = "rgba(0,0,0,0.25)";

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

	DrawIcons( tContext: CanvasRenderingContext2D, tZoom: number ): void
	{
		const tempTiles = this._app.map.tiles;
		const tempIconSize = Math.min( 30, 125 * Math.pow( 1 / Math.max( tZoom, 0.001 ), 1 ) );
		const tempWorldSize = tempIconSize / tZoom;
		const tempHalf = tempWorldSize / 2;

		for ( let i = tempTiles.length - 1; i >= 0; --i )
		{
			const tempTile = tempTiles[ i ];
			const tempIcons = tempTile.icons;

			for ( let j = tempIcons.length - 1; j >= 0; --j )
			{
				const tempIcon = tempIcons[ j ];
				const tempURL = `/icons/${tempIcon.Type}.png`;
				const tempBase = CACHE.LoadImage(
					tempURL,
					() =>
					{
						this._needsRender = true;
						this.QueueRender();
					}
				);

				if ( tempBase.complete && tempBase.naturalWidth !== 0 )
				{
					const tempTinted = CACHE.LoadIcon( tempBase, tempIcon );
					tContext.imageSmoothingEnabled = true;
					tContext.drawImage( tempTinted, tempIcon.pixelPosition.x - tempHalf, tempIcon.pixelPosition.y - tempHalf, tempWorldSize, tempWorldSize );

					this._iconHits.push( new IconHit( tempTile, tempIcon, tempHalf ) );
				}
			}
		}
	}

	DrawFireGroups( tContext: CanvasRenderingContext2D, tZoom: number ): void
	{
		const tempApp = this._app;
		const tempPxPerMeter = this.GetPixelsPerMeter();
		const tempZoomSafe = Math.max( tZoom, 0.001 );

		for ( let i = tempApp.fireGroups.length - 1; i >= 0; --i )
		{
			const tempGroup = tempApp.fireGroups[ i ];

			if ( tempGroup.IsVisible && tempGroup.baseWorldBind.Icon != null )
			{
				const tempBaseIcon = tempGroup.baseWorldBind.Icon!;
				const tempBasePhi = MathUtility.GetCompassToRadians( tempGroup.baseWorldBind.coordinate.Angle );
				const tempBaseDX = tempGroup.baseWorldBind.coordinate.Distance * Math.cos( tempBasePhi );
				const tempBaseDY = tempGroup.baseWorldBind.coordinate.Distance * Math.sin( tempBasePhi );
				const tempBaseWorldX = tempBaseIcon.worldPosition.x - tempBaseDX;
				const tempBaseWorldY = tempBaseIcon.worldPosition.y - tempBaseDY;

				let tempSpotterOriginX: number;
				let tempSpotterOriginY: number;

				if ( tempGroup.spotterWorldBind.Icon != null )
				{
					const tempSpotterIcon = tempGroup.spotterWorldBind.Icon!;
					const tempSpotterPhi = MathUtility.GetCompassToRadians( tempGroup.spotterWorldBind.coordinate.Angle );
					const tempSpotterDX = tempGroup.spotterWorldBind.coordinate.Distance * Math.cos( tempSpotterPhi );
					const tempSpotterDY = tempGroup.spotterWorldBind.coordinate.Distance * Math.sin( tempSpotterPhi );
					tempSpotterOriginX = tempSpotterIcon.worldPosition.x - tempSpotterDX;
					tempSpotterOriginY = tempSpotterIcon.worldPosition.y - tempSpotterDY;
				}
				else
				{
					tempSpotterOriginX = tempBaseWorldX;
					tempSpotterOriginY = tempBaseWorldY;
				}

				let tempSx = tempSpotterOriginX;
				let tempSy = tempSpotterOriginY;

				for ( let j = 0; j < tempGroup.spotters.length; ++j )
				{
					const tempLeg = tempGroup.spotters[ j ];
					const tempPhi = MathUtility.GetCompassToRadians( tempLeg.Angle );
					const tempVX = tempLeg.Distance * Math.cos( tempPhi );
					const tempVY = tempLeg.Distance * Math.sin( tempPhi );

					const tempNx = tempSx - tempVX;
					const tempNy = tempSy - tempVY;

					const tempA = this.GetWorldToPixel( { x: tempSx, y: tempSy } );
					const tempB = this.GetWorldToPixel( { x: tempNx, y: tempNy } );

					tContext.save();
					tContext.setLineDash( [] );
					tContext.strokeStyle = THEME.spotterStroke;
					tContext.lineWidth = 2.0 / tempZoomSafe;
					tContext.lineCap = "round";
					tContext.shadowColor = THEME.glow;
					tContext.shadowBlur = 1.5 / tempZoomSafe;
					tContext.beginPath();
					tContext.moveTo( tempA.x, tempA.y );
					tContext.lineTo( tempB.x, tempB.y );
					tContext.stroke();
					tContext.restore();

					tempSx = tempNx;
					tempSy = tempNy;
				}

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

				for ( let j = tempGroup.guns.length - 1; j >= 0; --j )
				{
					const tempGun = tempGroup.guns[ j ];

					this.DrawGun(
						tContext,
						tZoom,
						tempPxPerMeter,
						tempBaseWorldX,
						tempBaseWorldY,
						tempTargetWorldX,
						tempTargetWorldY,
						tempGroup,
						tempGun
					);
				}

				this.DrawTarget(
					tContext,
					tZoom,
					tempTargetWorldX,
					tempTargetWorldY
				);
			}
		}
	}

	protected DrawArrowhead(
		tContext: CanvasRenderingContext2D,
		tZoom: number,
		tFromX: number,
		tFromY: number,
		tToX: number,
		tToY: number,
		tColor: string
	): void
	{
		const tempZoomSafe = Math.max( tZoom, 0.001 );
		const tempDX = tToX - tFromX;
		const tempDY = tToY - tFromY;
		const tempLen = Math.hypot( tempDX, tempDY );

		if ( tempLen > 1e-6 )
		{
			const tempAngle = Math.atan2( tempDY, tempDX );
			const tempSize = 8 / tempZoomSafe;   // arrow length
			const tempTheta = Math.PI / 7;       // wing angle (~25.7°)

			const tempLeftX = tToX - Math.cos( tempAngle - tempTheta ) * tempSize;
			const tempLeftY = tToY - Math.sin( tempAngle - tempTheta ) * tempSize;

			const tempRightX = tToX - Math.cos( tempAngle + tempTheta ) * tempSize;
			const tempRightY = tToY - Math.sin( tempAngle + tempTheta ) * tempSize;

			tContext.save();
			tContext.lineJoin = "round";
			tContext.lineCap = "round";
			tContext.fillStyle = tColor;
			tContext.strokeStyle = tColor;
			tContext.lineWidth = 1 / tempZoomSafe;
			tContext.beginPath();
			tContext.moveTo( tToX, tToY );
			tContext.lineTo( tempLeftX, tempLeftY );
			tContext.lineTo( tempRightX, tempRightY );
			tContext.closePath();
			tContext.fill();
			tContext.stroke();
			tContext.restore();
		}
	}

	protected DrawTextLabel(
		tContext: CanvasRenderingContext2D,
		tZoom: number,
		tX: number,
		tY: number,
		tText: string,
		tColor: string
	): void
	{
		const tempIsValid = tText != null && tText.trim() !== "";

		if ( tempIsValid )
		{
			const tempZoomSafe = Math.max( tZoom, 0.001 );
			const tempFontPx = Math.max( 10, Math.round( 12 / tempZoomSafe ) ); // readable but scales with zoom
			const tempOffsetX = 6 / tempZoomSafe;
			const tempOffsetY = -6 / tempZoomSafe; // nudge slightly above the dot

			tContext.save();
			tContext.font = `${tempFontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial`;
			tContext.textAlign = "left";
			tContext.textBaseline = "middle";
			tContext.fillStyle = tColor;

			// subtle glow for legibility
			tContext.shadowColor = THEME.glow;
			tContext.shadowBlur = 2 / tempZoomSafe;

			tContext.fillText( tText, tX + tempOffsetX, tY + tempOffsetY );
			tContext.restore();
		}
	}

	protected DrawGun(
		tContext: CanvasRenderingContext2D,
		tZoom: number,
		tPxPerMeter: number,
		tBaseWorldX: number,
		tBaseWorldY: number,
		tTargetWorldX: number,
		tTargetWorldY: number,
		tGroup: any,
		tGun: any
	): void
	{
		const tempZoomSafe = Math.max( tZoom, 0.001 );

		// Gun world coordinates from Base
		const tempPhiGun = MathUtility.GetCompassToRadians( tGun.location.Angle );
		const tempGunWorldX = tBaseWorldX + tGun.location.Distance * Math.cos( tempPhiGun );
		const tempGunWorldY = tBaseWorldY + tGun.location.Distance * Math.sin( tempPhiGun );

		// Pixels for base and gun
		const tempPBase = this.GetWorldToPixel( { x: tBaseWorldX, y: tBaseWorldY } );
		const tempPGun  = this.GetWorldToPixel( { x: tempGunWorldX,  y: tempGunWorldY } );

		// Wind
		const tempPhiWind = MathUtility.GetCompassToRadians( tGroup.wind.Angle );
		const tempWindX = Math.cos( tempPhiWind );
		const tempWindY = Math.sin( tempPhiWind );
		const tempDriftX = tGun.Type.windEffect * tGroup.wind.Strength * tempWindX;
		const tempDriftY = tGun.Type.windEffect * tGroup.wind.Strength * tempWindY;

		// Donut center (pixels)
		const tempCenterX = tempPGun.x + tempDriftX * tPxPerMeter;
		const tempCenterY = tempPGun.y - tempDriftY * tPxPerMeter;

		// Range donut (min/max rings around drift center)
		const tempRInner = Math.max( 0, tGun.Type.rangeMin ) * tPxPerMeter;
		const tempROuter = Math.max( 0, tGun.Type.rangeMax ) * tPxPerMeter;

		tContext.save();
		tContext.shadowColor = THEME.glow;
		tContext.shadowBlur = 2 / tempZoomSafe;
		this.DrawDonut(
			tContext,
			tempCenterX,
			tempCenterY,
			tempRInner,
			tempROuter,
			1.0 / tempZoomSafe,
			THEME.rangeFill,
			THEME.rangeRing
		);
		tContext.restore();

		// Base -> Gun (solid blue) + tiny blue dot at the gun endpoint
		tContext.save();
		tContext.lineCap = "round";
		tContext.setLineDash( [] );
		tContext.strokeStyle = THEME.baseGunStroke;
		tContext.lineWidth = 2.0 / tempZoomSafe;
		tContext.shadowColor = THEME.glow;
		tContext.shadowBlur = 1.5 / tempZoomSafe;
		tContext.beginPath();
		tContext.moveTo( tempPBase.x, tempPBase.y );
		tContext.lineTo( tempPGun.x,  tempPGun.y  );
		tContext.stroke();

		// Tiny blue dot at gun
		const tempGunDotR = 2.5 / tempZoomSafe;
		tContext.fillStyle = THEME.baseGunStroke;
		tContext.beginPath();
		tContext.arc( tempPGun.x, tempPGun.y, tempGunDotR, 0, Math.PI * 2 );
		tContext.fill();
		tContext.restore();

		// Gun name label in blue next to the dot
		this.DrawTextLabel(
			tContext,
			tZoom,
			tempPGun.x,
			tempPGun.y,
			tGun.Name,
			THEME.baseGunStroke
		);

		// Dashed BLUE line from Gun -> donut center
		tContext.save();
		tContext.lineCap = "round";
		tContext.shadowColor = THEME.glow;
		tContext.shadowBlur = 1.0 / tempZoomSafe;
		tContext.setLineDash( [ 6 / tempZoomSafe, 5 / tempZoomSafe ] );
		tContext.strokeStyle = THEME.baseGunStroke;
		tContext.lineWidth = 1.5 / tempZoomSafe;
		tContext.beginPath();
		tContext.moveTo( tempPGun.x, tempPGun.y );
		tContext.lineTo( tempCenterX, tempCenterY );
		tContext.stroke();
		tContext.restore();

		this.DrawArrowhead(
			tContext,
			tZoom,
			tempPGun.x,
			tempPGun.y,
			tempCenterX,
			tempCenterY,
			THEME.baseGunStroke
		);

		// ---- Compute compensated aim and actual landing (clamped) ----
		const tempAX = ( tTargetWorldX - tempDriftX ) - tempGunWorldX;
		const tempAY = ( tTargetWorldY - tempDriftY ) - tempGunWorldY;
		const tempAD = Math.hypot( tempAX, tempAY );

		let tempLandWorldX = tempGunWorldX + tempDriftX;
		let tempLandWorldY = tempGunWorldY + tempDriftY;

		if ( tempAD > 1e-6 )
		{
			const tempUX = tempAX / tempAD;
			const tempUY = tempAY / tempAD;

			const tempDMin = Math.max( 0, tGun.Type.rangeMin );
			const tempDMax = Math.max( tempDMin, tGun.Type.rangeMax );
			const tempDClamped = Math.max( tempDMin, Math.min( tempDMax, tempAD ) );

			const tempAimWorldX = tempGunWorldX + tempUX * tempDClamped;
			const tempAimWorldY = tempGunWorldY + tempUY * tempDClamped;

			tempLandWorldX = tempAimWorldX + tempDriftX;
			tempLandWorldY = tempAimWorldY + tempDriftY;
		}

		// Pixels for landing
		const tempPLand = this.GetWorldToPixel( { x: tempLandWorldX, y: tempLandWorldY } );

		// Dashed GREEN line Gun -> LANDING (clamped)
		tContext.save();
		tContext.lineCap = "round";
		tContext.shadowColor = THEME.glow;
		tContext.shadowBlur = 1.5 / tempZoomSafe;
		tContext.setLineDash( [ 8 / tempZoomSafe, 6 / tempZoomSafe ] );
		tContext.strokeStyle = THEME.toTargetStroke;
		tContext.lineWidth = 2 / tempZoomSafe;
		tContext.beginPath();
		tContext.moveTo( tempPGun.x, tempPGun.y );
		tContext.lineTo( tempPLand.x, tempPLand.y );
		tContext.stroke();

		const tempCapR = 2.5 / tempZoomSafe;
		tContext.fillStyle = THEME.toTargetStroke;
		tContext.beginPath();
		tContext.arc( tempPLand.x, tempPLand.y, tempCapR, 0, Math.PI * 2 );
		tContext.fill();
		tContext.restore();

		// Dispersion circle centered at LANDING (meters -> px)
		const tempDispersionRpx = Math.max( 0, tGun.AimRadius ) * tPxPerMeter;
		this.DrawDispersion(
			tContext,
			tZoom,
			tempPLand.x,
			tempPLand.y,
			tempDispersionRpx
		);
	}

	protected DrawDispersion(
		tContext: CanvasRenderingContext2D,
		tZoom: number,
		tCenterPxX: number,
		tCenterPxY: number,
		tRadiusPx: number
	): void
	{
		const tempZoomSafe = Math.max( tZoom, 0.001 );
		tContext.save();
		tContext.shadowColor = THEME.glow;
		tContext.shadowBlur = 2 / tempZoomSafe;
		this.DrawCircle(
			tContext,
			tCenterPxX,
			tCenterPxY,
			tRadiusPx,
			THEME.dispersionFill,
			THEME.dispersionRing,
			1.25 / tempZoomSafe
		);
		tContext.restore();
	}

	protected DrawTarget(
		tContext: CanvasRenderingContext2D,
		tZoom: number,
		tWorldX: number,
		tWorldY: number
	): void
	{
		const tempZoomSafe = Math.max( tZoom, 0.001 );
		const tempP = this.GetWorldToPixel( { x: tWorldX, y: tWorldY } );

		tContext.save();
		tContext.lineCap = "round";
		tContext.lineJoin = "round";
		tContext.shadowColor = THEME.glow;
		tContext.shadowBlur = 2 / tempZoomSafe;

		tContext.beginPath();
		tContext.arc( tempP.x, tempP.y, 11 / tempZoomSafe, 0, Math.PI * 2 );
		tContext.lineWidth = 1.5 / tempZoomSafe;
		tContext.strokeStyle = THEME.targetRing;
		tContext.stroke();

		tContext.beginPath();
		tContext.arc( tempP.x, tempP.y, 3 / tempZoomSafe, 0, Math.PI * 2 );
		tContext.fillStyle = THEME.targetFill;
		tContext.fill();

		tContext.restore();
	}

	DrawCircle(
		tContext: CanvasRenderingContext2D,
		tCx: number,
		tCy: number,
		tR: number,
		tFill: string,
		tStroke: string,
		tLineWidth: number
	): void
	{
		tContext.save();
		tContext.beginPath();
		tContext.arc( tCx, tCy, tR, 0, Math.PI * 2 );
		tContext.fillStyle = tFill;
		tContext.fill();
		tContext.lineWidth = tLineWidth;
		tContext.strokeStyle = tStroke;
		tContext.stroke();
		tContext.restore();
	}

	DrawDonut(
		tContext: CanvasRenderingContext2D,
		tCx: number,
		tCy: number,
		tRInner: number,
		tROuter: number,
		tLineWidth: number,
		tFillRGBA: string,
		tRingRGBA: string
	): void
	{
		tContext.save();

		tContext.beginPath();
		tContext.arc( tCx, tCy, tROuter, 0, Math.PI * 2 );
		tContext.arc( tCx, tCy, tRInner, 0, Math.PI * 2, true );
		tContext.fillStyle = tFillRGBA;
		tContext.fill( "evenodd" );

		tContext.setLineDash( [] );
		tContext.lineWidth = tLineWidth;
		tContext.strokeStyle = tRingRGBA;

		tContext.beginPath();
		tContext.arc( tCx, tCy, tRInner, 0, Math.PI * 2 );
		tContext.stroke();

		tContext.beginPath();
		tContext.arc( tCx, tCy, tROuter, 0, Math.PI * 2 );
		tContext.stroke();

		tContext.restore();
	}

	GetWorldToPixel( tPoint: { x: number; y: number } ): { x: number; y: number }
	{
		const tempTiles = this._app.map.tiles;
		const tempTile = tempTiles.find( x => x.axial.q === 0 && x.axial.r === 0 ) ?? tempTiles[ 0 ];

		const tempPxPerMeterX = tempTile.rectangle.Width / ( MAX_X_M - MIN_X_M );
		const tempPxPerMeterY = tempTile.rectangle.Height / ( MAX_Y_M - MIN_Y_M );

		const tempDX = ( tPoint.x - tempTile.worldPosition.x ) * tempPxPerMeterX;
		const tempDY = -( tPoint.y - tempTile.worldPosition.y ) * tempPxPerMeterY;

		return { x: tempTile.position.x + tempDX, y: tempTile.position.y + tempDY };
	}

	GetPixelsPerMeter(): number
	{
		const tempTiles = this._app.map.tiles;

		if ( tempTiles != null && tempTiles.length > 0 )
		{
			const tempTile = tempTiles.find( x => x.axial.q === 0 && x.axial.r === 0 ) ?? tempTiles[ 0 ];

			const tempPxPerMeterX = tempTile.rectangle.Width / ( MAX_X_M - MIN_X_M );
			const tempPxPerMeterY = tempTile.rectangle.Height / ( MAX_Y_M - MIN_Y_M );

			return ( tempPxPerMeterX + tempPxPerMeterY ) * 0.5;
		}

		return 0;
	}

	render(): React.ReactNode
	{
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

		if ( this._app.IsSelectingMapIcon )
		{
			tempClass += " cursor-crosshair";
		}

		return (
			<div
				ref={ this._wrapRef }
				className={ tempClass }
				onPointerDown={ this.OnPointerDown }
				onPointerMove={ this.OnPointerMove }
				onPointerUp={ this.OnPointerUp }
				onClick={ this.OnClick }
			>
				<button
					className="absolute right-3 top-3 z-10 rounded-md border border-white/10 bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-800"
					onClick={ this.OnUpdateClick }
					onPointerDown={ ( tEvent ) => tEvent.stopPropagation() }
					disabled={ this.state.isUpdating }
				>
					{ this.state.isUpdating ? "Updating…" : "Update" }
				</button>

				<canvas ref={ this._canvasRef } style={ tempCanvasStyle } />
			</div>
		);
	}
}

const ObservedWorldMapView = observer( WorldMapView );
export default ObservedWorldMapView;
