import { action, comparer, makeObservable, observable, reaction } from "mobx";
import Gun from "./Gun";
import type GunType from "./GunType";
import Point from "./Point";
import PolarCoordinate from "./PolarCoordinate";
import MathUtility from "./Utility/MathUtility";
import Wind from "./Wind";
import type WindStrength from "./WindStrength";

export default class FireGroup
{
	public isVisible: boolean = true;
	public readonly wind: Wind;
	public readonly targetFromSpotter: PolarCoordinate = new PolarCoordinate();
	public readonly spotters: PolarCoordinate[] = []; // 0 is origin, rest behave as chain S1->S0, S2->S1
	public readonly guns: Gun[] = [];
	protected _disposeRecalculation?: () => void;

	constructor( tDefaultWindStrength: WindStrength )
	{
		makeObservable(
			this,
			{
				isVisible: observable,
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
				this.wind.strength,
				this.wind.angle,
				this.targetFromSpotter.distance,
				this.targetFromSpotter.angle,
				this.spotters.length,
				...this.spotters.flatMap( x => [ x.distance, x.angle ] ),
				this.guns.length,
				...this.guns.flatMap( x => [ x.location.distance, x.location.angle, x.type ] )
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

	AddGun( tType: GunType )
	{
		this.guns.push( new Gun( tType ) );
	}

	RemoveGun( tIndex: number )
	{
		this.guns.splice( tIndex, 1 );
	}

	AddSpotter()
	{
		this.spotters.push( new PolarCoordinate() );
	}

	RemoveSpotter( tIndex: number )
	{
		this.spotters.splice( tIndex, 1 );
	}

	Dispose()
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
			const tempPhi = MathUtility.GetCompassToRadians( tempLeg.angle );
			const tempVx = tempLeg.distance * Math.cos( tempPhi );
			const tempVy = tempLeg.distance * Math.sin( tempPhi ); // vector from S{i+1} -> S{i}

			tempSpotters.push( new Point( tempSpotters[ i ].x - tempVx, tempSpotters[ i ].y - tempVy ) );
		}

		const tempLastSpotter = tempSpotters[ tempSpotters.length - 1 ];

		// Target world position from last Spotter
		const tempPhiTarget = MathUtility.GetCompassToRadians( this.targetFromSpotter.angle );
		const tempTarget = new Point( tempLastSpotter.x + this.targetFromSpotter.distance * Math.cos( tempPhiTarget ), tempLastSpotter.y + this.targetFromSpotter.distance * Math.sin( tempPhiTarget ) );

		// Precompute Wind unit vectors
		const tempPhiWind = MathUtility.GetCompassToRadians( this.wind.angle );
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
			const tempPhiGun = MathUtility.GetCompassToRadians( tempGun.location.angle );
			const tempGunPoint = new Point( tempSpotters[ 0 ].x + tempGun.location.distance * Math.cos( tempPhiGun ), tempSpotters[ 0 ].y + tempGun.location.distance * Math.sin( tempPhiGun ) );
			const tempRange = Math.hypot( tempTarget.x - tempGunPoint.x, tempTarget.y - tempGunPoint.y );

			// Wind drift model (per-100m scaling)
			const tempAlong = this.wind.strength.along;
			const tempCross = this.wind.strength.cross;
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
			const tempClamped = Math.max( tempGun.type.rangeMin, Math.min( tempGun.type.rangeMax, tempRangeAim ) );

			if ( tempClamped !== tempRangeAim )
			{
				const tempAimScale = tempRangeAim === 0 ? 0 : ( tempClamped / tempRangeAim );
				tempAimX *= tempAimScale;
				tempAimY *= tempAimScale;
				tempRangeAim = tempClamped;
				tempPhiAim = Math.atan2( tempAimY, tempAimX );
			}

			// Populate Gun target in polar coords
			tempGun.target.distance = tempRangeAim;
			tempGun.target.angle = MathUtility.GetRadiansToCompass( tempPhiAim );

			const tempTheta = tempGun.type.rangeMax > tempGun.type.rangeMin ? Math.min( 1, Math.max( 0, ( tempRangeAim - tempGun.type.rangeMin ) / ( tempGun.type.rangeMax - tempGun.type.rangeMin ) ) ) : 1;
			tempGun.targetRadius = tempGun.type.inaccuracyMin + ( tempGun.type.inaccuracyMax - tempGun.type.inaccuracyMin ) * tempTheta;
		}
	}
}
