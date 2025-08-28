import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireControl/FireGroup";
import type GunType from "../../Model/FireControl/GunType";
import { GunRow } from "./GunRow";

export const GunsEditor = observer(
	function GunsEditor( props: { fireGroup: FireGroup; gunTypes: GunType[] } )
	{
		const { fireGroup, gunTypes } = props;

		return (
			<fieldset className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
				<legend className="px-1 text-sm text-zinc-300">Guns</legend>
				<div className="grid gap-2">
					{fireGroup.guns.map((tempGun, tempIndex) => (
						<GunRow
							key={tempIndex}
							gun={tempGun}
							gunTypes={gunTypes}
							onRemove={() => fireGroup.RemoveGun(tempIndex)}
						/>
					))}
					<div>
						<button
							className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
							onClick={() => fireGroup.AddGun(gunTypes[0])}
						>
							+ Add gun
						</button>
					</div>
				</div>
			</fieldset>
		);
	}
);
