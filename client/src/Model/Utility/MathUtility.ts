export default class MathUtility
{
	public static readonly TAU = Math.PI * 2;

	public static GetRadians( tDegrees: number ): number
	{
		return tDegrees * Math.PI / 180;
	}

	public static GetDegrees( tRadians: number ): number
	{
		return tRadians * 180 / Math.PI;
	}

	public static Get360Wrap( tAngle: number ): number
	{
		tAngle = tAngle % 360;

		if ( tAngle < 0 )
		{
			tAngle += 360;
		}

		return tAngle;
	};

	public static GetCompassToRadians( tDegrees: number ): number
	{
		return MathUtility.GetRadians( 90 - tDegrees );
	}

	public static GetRadiansToCompass( tRadians: number ): number
	{
		return this.Get360Wrap( 90 - this.GetDegrees( tRadians ) );
	}
}
