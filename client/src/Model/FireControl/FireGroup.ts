import { action, comparer, makeObservable, observable, reaction, computed, runInAction } from "mobx";
import Gun from "./Gun";
import type GunType from "./GunType";
import Point from "../Point";
import PolarCoordinate from "./PolarCoordinate";
import MathUtility from "../Utility/MathUtility";
import Wind from "./Wind";
import Target from "./Target";
import type { Snapshot as PolarCoordinateSnapshot } from "./PolarCoordinate";
import type { Snapshot as TargetSnapshot } from "./Target";
import type { Snapshot as WindSnapshot } from "./Wind";
import type { Snapshot as GunSnapshot } from "./Gun";

export type Snapshot =
{
	name: string;
	wind: WindSnapshot;
	targets: TargetSnapshot[];
	spotters: PolarCoordinateSnapshot[];
	guns: GunSnapshot[];
	activeTarget: string | null;
};

export default class FireGroup
{
	protected _isVisible: boolean = true;
	protected _name: string = "Fire Group";
	public readonly wind: Wind = new Wind();
	public readonly targets: Target[] = [];
	public readonly spotters: PolarCoordinate[] = []; // 0 is origin, rest behave as chain S1->S0, S2->S1
	public readonly guns: Gun[] = [];
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
				...this.guns.flatMap( x => [ x.location.Distance, x.location.Angle, x.Type ] )
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

	public Calculate()
	{
		// Build Spotter world positions from inverse legs
		const tempSpottersLength = this.spotters.length;
		const tempSpotters: Point[] = [];
		tempSpotters.push( new Point( 0, 0 ) ); // S0

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

		// Per Gun solution
		const tempGunsLength = this.guns.length;

		for ( let i = 0; i < tempGunsLength; ++i )
		{
			const tempGun = this.guns[ i ];

			// Gun world from S0 (S0->G polar)
			const tempPhiGun = MathUtility.GetCompassToRadians( tempGun.location.Angle );
			const tempGunPoint = new Point( tempSpotters[ 0 ].x + tempGun.location.Distance * Math.cos( tempPhiGun ), tempSpotters[ 0 ].y + tempGun.location.Distance * Math.sin( tempPhiGun ) );
			//const tempRange = Math.hypot( tempTarget.x - tempGunPoint.x, tempTarget.y - tempGunPoint.y );

			// Wind drift model (per-100m scaling)
			const tempDriftX = tempGun.Type.windEffect * this.wind.Strength * tempWindX;
			const tempDriftY = tempGun.Type.windEffect * this.wind.Strength * tempWindY;

			// Aim upwind so downwind drift lands on T
			const tempCX = tempTarget.x - tempDriftX;
			const tempCY = tempTarget.y - tempDriftY;

			// Aim vector G -> Aim
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
			name: this._name,
			wind: this.wind.Snapshot,
			targets: this.targets.flatMap( x => x.Snapshot ),
			spotters: this.spotters.flatMap( x => x.Snapshot ),
			guns: this.guns.flatMap( x => x.Snapshot ),
			activeTarget: this._activeTarget?.Name ?? null
		};
	}

	public Load( tSnapshot: Snapshot, tGunTypes: GunType[] )
	{
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

		this.Calculate();
	}
}
