import { action, comparer, makeObservable, observable, reaction, computed, runInAction } from "mobx";
import Gun from "./Gun";
import type GunType from "./GunType";
import Point from "./Point";
import PolarCoordinate from "./PolarCoordinate";
import MathUtility from "./Utility/MathUtility";
import Wind from "./Wind";
import type WindStrength from "./WindStrength";

export default class FireGroup
{
	protected _isVisible: boolean = true;
	protected _name: string = "Fire Group";
	public readonly wind: Wind;
	public readonly targetFromSpotter: PolarCoordinate = new PolarCoordinate( 0, 0 );
	public readonly spotters: PolarCoordinate[] = []; // 0 is origin, rest behave as chain S1->S0, S2->S1
	public readonly guns: Gun[] = [];
	protected _disposeRecalculation?: () => void;

	constructor( tDefaultWindStrength: WindStrength )
	{
		makeObservable<FireGroup, "_isVisible" | "_name">(
			this,
			{
				_isVisible: observable,
				IsVisible: computed,
				_name: observable,
				Name: computed,
				ToggleVisible: action,
				spotters: observable.shallow,
				guns: observable.shallow,
				Calculate: action,
				AddGun: action,
				RemoveGun: action,
				AddSpotter: action,
				RemoveSpotter: action
			}
		);

		this.wind = new Wind( tDefaultWindStrength );

		this._disposeRecalculation = reaction(
			() =>
			[
				this.wind.Strength,
				this.wind.Angle,
				this.targetFromSpotter.Distance,
				this.targetFromSpotter.Angle,
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

	public AddGun( tType: GunType )
	{
		this.guns.push( new Gun( tType ) );
	}

	public RemoveGun( tIndex: number )
	{
		this.guns.splice( tIndex, 1 );
	}

	public AddSpotter()
	{
		this.spotters.push( new PolarCoordinate( 0, 0 ) );
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
		const tempPhiTarget = MathUtility.GetCompassToRadians( this.targetFromSpotter.Angle );
		const tempTarget = new Point( tempLastSpotter.x + this.targetFromSpotter.Distance * Math.cos( tempPhiTarget ), tempLastSpotter.y + this.targetFromSpotter.Distance * Math.sin( tempPhiTarget ) );

		// Precompute Wind unit vectors
		const tempPhiWind = MathUtility.GetCompassToRadians( this.wind.Angle );
		const tempWindX = Math.cos( tempPhiWind );
		const tempWindY = Math.sin( tempPhiWind ); // unit wind (toward)
		const tempWindPX = -tempWindY;
		const tempWindPY = tempWindX; // left-perpendicular

		// Per Gun solution
		const tempGunsLength = this.guns.length;

		for ( let i = 0; i < tempGunsLength; ++i )
		{
			const tempGun = this.guns[ i ];

			// Gun world from S0 (S0->G polar)
			const tempPhiGun = MathUtility.GetCompassToRadians( tempGun.location.Angle );
			const tempGunPoint = new Point( tempSpotters[ 0 ].x + tempGun.location.Distance * Math.cos( tempPhiGun ), tempSpotters[ 0 ].y + tempGun.location.Distance * Math.sin( tempPhiGun ) );
			const tempRange = Math.hypot( tempTarget.x - tempGunPoint.x, tempTarget.y - tempGunPoint.y );

			// Wind drift model (per-100m scaling)
			const tempAlong = this.wind.Strength.along;
			const tempCross = this.wind.Strength.cross;
			const tempScaledRange = tempRange / 100; // scale with travel distance
			const tempDriftX = tempScaledRange * (tempAlong * tempWindX + tempCross * tempWindPX );
			const tempDriftY = tempScaledRange * (tempAlong * tempWindY + tempCross * tempWindPY );

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
			tempGun.target.Distance = tempRangeAim;
			tempGun.target.Angle = MathUtility.GetRadiansToCompass( tempPhiAim );

			const tempTheta = tempGun.Type.rangeMax > tempGun.Type.rangeMin ? Math.min( 1, Math.max( 0, ( tempRangeAim - tempGun.Type.rangeMin ) / ( tempGun.Type.rangeMax - tempGun.Type.rangeMin ) ) ) : 1;
			tempGun.TargetRadius = tempGun.Type.inaccuracyMin + ( tempGun.Type.inaccuracyMax - tempGun.Type.inaccuracyMin ) * tempTheta;
		}
	}
}
