import { action, comparer, makeObservable, observable, reaction, computed, runInAction } from "mobx";
import Gun from "./Gun";
import type GunType from "./GunType";
import Point from "../Point";
import PolarCoordinate from "../PolarCoordinate";
import MathUtility from "../Utility/MathUtility";
import Wind from "./Wind";
import Target from "./Target";
import type { Snapshot as PolarCoordinateSnapshot } from "../PolarCoordinate";
import type { Snapshot as TargetSnapshot } from "./Target";
import type { Snapshot as WindSnapshot } from "./Wind";
import type { Snapshot as GunSnapshot } from "./Gun";
import type { Snapshot as WorldBindSnapshot } from "./WorldBind";
import WorldBind from "./WorldBind";
import type Tile from "../Map/Tile";
import type Icon from "../Map/Icon";

export type Snapshot =
{
	isVisible: boolean;
	name: string;
	wind: WindSnapshot;
	targets: TargetSnapshot[];
	spotters: PolarCoordinateSnapshot[];
	guns: GunSnapshot[];
	activeTarget: string | null;
	baseWorldBind: WorldBindSnapshot;
	spotterWorldBind: WorldBindSnapshot;
};

export default class FireGroup
{
	protected _isVisible: boolean = true;
	protected _name: string = "Fire Group";
	public readonly wind: Wind = new Wind();
	public readonly targets: Target[] = [];
	public readonly spotters: PolarCoordinate[] = []; // 0 is origin, rest behave as chain S1->S0, S2->S1
	public readonly guns: Gun[] = [];
	public readonly baseWorldBind: WorldBind = new WorldBind();
	public readonly spotterWorldBind: WorldBind = new WorldBind();
	protected _activeTarget: Target | null = null;
	protected _disposeRecalculation?: () => void;

	constructor( tName: string )
	{
		makeObservable<FireGroup, "_isVisible" | "_name" | "_activeTarget">(
			this,
			{
				_isVisible: observable,
				IsVisible: computed,
				_name: observable,
				Name: computed,
				ToggleVisible: action,
				targets: observable.shallow,
				_activeTarget: observable,
				ActiveTarget: computed,
				spotters: observable.shallow,
				guns: observable.shallow,
				baseWorldBind: observable,
				spotterWorldBind: observable,
				IsSelectingMapIcon: computed,
				OnMapIconSelect: action,
				ClearWorldBinds: action,
				Calculate: action,
				AddTarget: action,
				RemoveTarget: action,
				AddGun: action,
				RemoveGun: action,
				AddSpotter: action,
				RemoveSpotter: action,
				Load: action
			}
		);

		this._disposeRecalculation = reaction(
			() =>
			[
				this.wind.Strength,
				this.wind.Angle,
				this.ActiveTarget,
				this.ActiveTarget?.coordinate.Distance ?? 0,
				this.ActiveTarget?.coordinate.Angle ?? 0,
				this.spotters.length,
				...this.spotters.flatMap( x => [ x.Distance, x.Angle ] ),
				this.guns.length,
				...this.guns.flatMap( x => [ x.location.Distance, x.location.Angle, x.Type ] ),
				this.baseWorldBind.Icon,
				this.baseWorldBind.coordinate.Distance ?? 0,
				this.baseWorldBind.coordinate.Angle ?? 0,
				this.spotterWorldBind.Icon,
				this.spotterWorldBind.coordinate.Distance ?? 0,
				this.spotterWorldBind.coordinate.Angle ?? 0
			],
			() =>
			{
				this.Calculate();
			},
			{
				equals: comparer.shallow
			}
		);

		this._name = tName;
	}

	public get IsVisible()
	{
		return this._isVisible;
	}

	public ToggleVisible()
	{
		this._isVisible = !this._isVisible;
	}

	public get MessageText()
	{
		const tempListLength = this.guns.length;
		let tempMessage = "";

		for ( let i = 0; i < tempListLength; ++i )
		{
			tempMessage += this.guns[ i ].MessageText;

			if ( i > 0 )
			{
				tempMessage += "     ";
			}
		}

		return tempMessage;
	}

	public get Name()
	{
		return this._name;
	}

	public set Name( tValue: string )
	{
		runInAction( () => { this._name = tValue; } )
	}

	public AddTarget()
	{
		this.targets.push( new Target( `Target ${this.targets.length + 1}` ) );

		if ( this._activeTarget == null )
		{
			this._activeTarget = this.targets[ 0 ];
		}
	}

	public RemoveTarget( tIndex: number )
	{
		const tempTarget = this.targets[ tIndex ];
		this.targets.splice( tIndex, 1 );

		if ( tempTarget == this.ActiveTarget )
		{
			this._activeTarget = this.targets.length > 0 ? this.targets[ 0 ] : null;
		}
	}

	public get ActiveTarget(): Target | null
	{
		return this._activeTarget;
	}

	public set ActiveTarget( tValue: Target | null )
	{
		runInAction( () => { this._activeTarget = tValue; } )
	}

	public AddGun( tType: GunType )
	{
		this.guns.push( new Gun( `Gun ${this.guns.length + 1}`, tType ) );
	}

	public RemoveGun( tIndex: number )
	{
		this.guns.splice( tIndex, 1 );
	}

	public AddSpotter()
	{
		this.spotters.push( new PolarCoordinate() );
	}

	public RemoveSpotter( tIndex: number )
	{
		this.spotters.splice( tIndex, 1 );
	}

	public Dispose()
	{
		this._disposeRecalculation?.();
	}

	public get IsSelectingMapIcon()
	{
		return this.baseWorldBind.IsSelecting || this.spotterWorldBind.IsSelecting;
	}

	public OnMapIconSelect( tIcon: Icon )
	{
		if ( this.baseWorldBind.IsSelecting )
		{
			this.baseWorldBind.Icon = tIcon;
		}

		if ( this.spotterWorldBind.IsSelecting )
		{
			this.spotterWorldBind.Icon = tIcon;
		}
	}

	public ClearWorldBinds()
	{
		this.baseWorldBind.Icon = null;
		this.spotterWorldBind.Icon = null;
	}

	public Calculate()
	{
		// Build anchors
		let tempBaseWorld: Point | null = null;
		let tempSpotterOrigin: Point;

		if ( this.baseWorldBind.Icon != null )
		{
			const tempBaseIcon = this.baseWorldBind.Icon;
			const tempBasePhi = MathUtility.GetCompassToRadians( this.baseWorldBind.coordinate.Angle );
			const tempBaseDX = this.baseWorldBind.coordinate.Distance * Math.cos( tempBasePhi );
			const tempBaseDY = this.baseWorldBind.coordinate.Distance * Math.sin( tempBasePhi );
			tempBaseWorld = new Point( tempBaseIcon.worldPosition.x - tempBaseDX, tempBaseIcon.worldPosition.y - tempBaseDY );
		}

		if ( this.spotterWorldBind.Icon != null )
		{
			const tempSpotterIcon = this.spotterWorldBind.Icon;
			const tempSpotterPhi = MathUtility.GetCompassToRadians( this.spotterWorldBind.coordinate.Angle );
			const tempSpotterDX = this.spotterWorldBind.coordinate.Distance * Math.cos( tempSpotterPhi );
			const tempSpotterDY = this.spotterWorldBind.coordinate.Distance * Math.sin( tempSpotterPhi );

			tempSpotterOrigin = new Point( tempSpotterIcon.worldPosition.x - tempSpotterDX, tempSpotterIcon.worldPosition.y - tempSpotterDY );
		}
		else
		{
			tempSpotterOrigin = tempBaseWorld == null ? new Point( 0, 0 ) : tempBaseWorld;
		}

		// Build spotter chain
		const tempSpottersLength = this.spotters.length;
		const tempSpotters: Point[] = [];
		tempSpotters.push( tempSpotterOrigin ); // S0

		for ( let i = 0; i < tempSpottersLength; ++i )
		{
			const tempLeg = this.spotters[ i ];
			const tempPhi = MathUtility.GetCompassToRadians( tempLeg.Angle );
			const tempVx = tempLeg.Distance * Math.cos( tempPhi );
			const tempVy = tempLeg.Distance * Math.sin( tempPhi ); // vector from S{i+1} -> S{i}

			tempSpotters.push( new Point( tempSpotters[ i ].x - tempVx, tempSpotters[ i ].y - tempVy ) );
		}

		const tempLastSpotter = tempSpotters[ tempSpotters.length - 1 ];

		// Target world position from last Spotter
		const tempPhiTarget = MathUtility.GetCompassToRadians( this.ActiveTarget?.coordinate.Angle ?? 0 );
		const tempTargetDistance = this.ActiveTarget?.coordinate.Distance ?? 0;
		const tempTarget = new Point( tempLastSpotter.x + tempTargetDistance * Math.cos( tempPhiTarget ), tempLastSpotter.y + tempTargetDistance * Math.sin( tempPhiTarget ) );

		// Precompute Wind unit vectors
		const tempPhiWind = MathUtility.GetCompassToRadians( this.wind.Angle );
		const tempWindX = Math.cos( tempPhiWind );
		const tempWindY = Math.sin( tempPhiWind );

		// Per Gun solution (guns are from Base when set; else relative)
		const tempGunsLength = this.guns.length;

		for ( let i = 0; i < tempGunsLength; ++i )
		{
			const tempGun = this.guns[ i ];
			const tempGunAnchor = tempBaseWorld == null ? new Point( 0, 0 ) : tempBaseWorld;
			const tempPhiGun = MathUtility.GetCompassToRadians( tempGun.location.Angle );
			const tempGunPoint = new Point( tempGunAnchor.x + tempGun.location.Distance * Math.cos( tempPhiGun ), tempGunAnchor.y + tempGun.location.Distance * Math.sin( tempPhiGun ) );

			// Wind drift model
			const tempDriftX = tempGun.Type.windEffect * this.wind.Strength * tempWindX;
			const tempDriftY = tempGun.Type.windEffect * this.wind.Strength * tempWindY;
			const tempCX = tempTarget.x - tempDriftX;
			const tempCY = tempTarget.y - tempDriftY;

			// Aim vector G -> Aim (all in world space)
			let tempAimX = tempCX - tempGunPoint.x;
			let tempAimY = tempCY - tempGunPoint.y;
			let tempRangeAim = Math.hypot( tempAimX, tempAimY );
			let tempPhiAim = Math.atan2( tempAimY, tempAimX );

			// Clamp to weapon min/max range along the aim ray
			const tempClamped = Math.max( tempGun.Type.rangeMin, Math.min( tempGun.Type.rangeMax, tempRangeAim ) );

			if ( tempClamped !== tempRangeAim )
			{
				const tempAimScale = tempRangeAim === 0 ? 0 : ( tempClamped / tempRangeAim );
				tempAimX *= tempAimScale;
				tempAimY *= tempAimScale;
				tempRangeAim = tempClamped;
				tempPhiAim = Math.atan2( tempAimY, tempAimX );
			}

			// Populate Gun target in polar coords
			tempGun.aim.Distance = tempRangeAim;
			tempGun.aim.Angle = MathUtility.GetRadiansToCompass( tempPhiAim );
			const tempTheta = tempGun.Type.rangeMax > tempGun.Type.rangeMin ? Math.min( 1, Math.max( 0, ( tempRangeAim - tempGun.Type.rangeMin ) / ( tempGun.Type.rangeMax - tempGun.Type.rangeMin ) ) ) : 1;
			tempGun.AimRadius = tempGun.Type.inaccuracyMin + ( tempGun.Type.inaccuracyMax - tempGun.Type.inaccuracyMin ) * tempTheta;
		}
	}

	public get Snapshot(): Snapshot
	{
		return {
			isVisible: this._isVisible,
			name: this._name,
			wind: this.wind.Snapshot,
			targets: this.targets.flatMap( x => x.Snapshot ),
			spotters: this.spotters.flatMap( x => x.Snapshot ),
			guns: this.guns.flatMap( x => x.Snapshot ),
			activeTarget: this._activeTarget?.Name ?? null,
			baseWorldBind: this.baseWorldBind.Snapshot,
			spotterWorldBind: this.spotterWorldBind.Snapshot
		};
	}

	public Load( tSnapshot: Snapshot, tGunTypes: GunType[], tTiles: Tile[] )
	{
		// General
		this._isVisible = tSnapshot.isVisible;
		this._name = tSnapshot.name;

		// Wind
		this.wind.Load( tSnapshot.wind );

		// Targets
		this.targets.length = 0;
		const tempTargetsLength = tSnapshot.targets.length;

		for ( let i = 0; i < tempTargetsLength; ++i )
		{
			const tempSnapshot = tSnapshot.targets[ i ];
			const tempTarget = new Target( tempSnapshot.name );
			tempTarget.Load( tSnapshot.targets[ i ] );
			this.targets.push( tempTarget );

			if ( tempTarget.Name == tSnapshot.activeTarget )
			{
				this._activeTarget = tempTarget;
			}
		}

		// Spotters
		this.spotters.length = 0;
		const tempSpottersLength = tSnapshot.spotters.length;

		for ( let i = 0; i < tempSpottersLength; ++i )
		{
			const tempSpotter = new PolarCoordinate();
			tempSpotter.Load( tSnapshot.spotters[ i ] );
			this.spotters.push( tempSpotter );
		}

		// Guns
		this.guns.length = 0;
		const tempGunsLength = tSnapshot.guns.length;
		const tempGunTypes = new Map<string, GunType>( tGunTypes.map( x => [ x.name, x ] ) );

		for ( let i = 0; i < tempGunsLength; ++i )
		{
			const tempSnapshot = tSnapshot.guns[ i ];
			const tempGun = new Gun( tempSnapshot.name, tempGunTypes.get( tempSnapshot.type ) ?? tGunTypes[ 0 ] );
			tempGun.Load( tempSnapshot );
			this.guns.push( tempGun );
		}

		// World Binds
		if ( tSnapshot.baseWorldBind != null )
		{
			this.baseWorldBind.Load( tSnapshot.baseWorldBind, tTiles );
		}

		if ( tSnapshot.spotterWorldBind != null )
		{
			this.spotterWorldBind.Load( tSnapshot.spotterWorldBind, tTiles );
		}

		this.Calculate();
	}
}
