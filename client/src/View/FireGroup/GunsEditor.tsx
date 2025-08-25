import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireGroup";
import type GunType from "../../Model/GunType";
import { GunRow } from "./GunRow";

export const GunsEditor = observer(
	function GunsEditor( props: { fireGroup: FireGroup; gunTypes: GunType[] } )
	{
		const { fireGroup, gunTypes } = props;

		return (
			<fieldset className="rounded-md border border-slate-200 p-3">
				<legend className="px-1 text-sm text-slate-600">Guns</legend>

				<div className="grid gap-2">
					{ fireGroup.guns.map( ( tempGun, tempIndex ) => (
						<GunRow
							key={ tempIndex }
							gun={ tempGun }
							gunTypes={ gunTypes }
							onRemove={ () => fireGroup.RemoveGun( tempIndex ) }
						/>
					))}
					<div>
						<button
							className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
							onClick={ () => fireGroup.AddGun( gunTypes[ 0 ] ) }
						>
							+ Add gun
						</button>
					</div>
				</div>
			</fieldset>
		);
	}
);
