import { makeObservable, observable, action } from "mobx";
import FireGroup from "./FireGroup";
import GunType from "./GunType";
import WindStrength from "./WindStrength";

export default class App
{
	public readonly gunTypes: GunType[];
	public readonly windStrengths: WindStrength[];
	public readonly fireGroups: FireGroup[] = [];

	constructor()
	{
		makeObservable(
			this,
			{
				fireGroups: observable.shallow,
				AddFireGroup: action,
				RemoveFireGroup: action,
				Dispose: action,
			}
		);

		this.gunTypes =
		[
			new GunType( "Cremari Mortar", 45, 80, 5.5, 12 ),
			new GunType( "120mm Huber Lariat", 100, 300, 25, 35 ),
			new GunType( "150mm Huber Exalt", 100, 300, 25, 35 ),
			new GunType( "300mm Storm Cannon", 400, 1000, 50, 50 )
		];

		this.windStrengths =
		[
			new WindStrength( "1", 2.5, 2.7 ),
			new WindStrength( "2", 8.2, 5.4 ),
			new WindStrength( "3", 16.5, 8.1 ),
			new WindStrength( "4", 27.2, 1.0 )
		];
	}

	public AddFireGroup()
	{
		this.fireGroups.push( new FireGroup( this.windStrengths[ 0 ] ) );
	}

	public RemoveFireGroup( tIndex: number )
	{
		const [ tempFireGroup ] = this.fireGroups.splice( tIndex, 1 );
		tempFireGroup?.Dispose?.();
	}

	public Dispose()
	{
		this.fireGroups.forEach( x => x.Dispose?.() );
		this.fireGroups.length = 0;
	}
}
