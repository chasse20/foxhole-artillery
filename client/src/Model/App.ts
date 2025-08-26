import { makeObservable, observable, action } from "mobx";
import FireGroup from "./FireGroup";
import GunType from "./GunType";

export default class App
{
	public readonly gunTypes: GunType[];
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
			new GunType( "Cremari Mortar", 45, 80, 5.5, 12, 5 ),
			new GunType( "120mm Huber Lariat", 100, 300, 25, 35, 10 ),
			new GunType( "150mm Huber Exalt", 100, 300, 25, 35, 10 ),
			new GunType( "300mm Storm Cannon", 400, 1000, 50, 50, 50 )
		];
	}

	public AddFireGroup()
	{
		this.fireGroups.push( new FireGroup() );
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
