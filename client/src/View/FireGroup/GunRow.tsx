import { observer } from "mobx-react-lite";
import type Gun from "../../Model/Gun";
import type GunType from "../../Model/GunType";
import MathUtility from "../../Model/Utility/MathUtility";

export const GunRow = observer(
	function GunRow( props: { gun: Gun; gunTypes: GunType[]; onRemove: () => void } )
	{
		const { gun, gunTypes, onRemove } = props;

		const tempTypeIndex = Math.max( 0, gunTypes.indexOf( gun.type ) );

		return (
			<div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-md border border-slate-200 p-3">
				<label className="grid gap-1">
					<span className="text-xs text-slate-600">Type</span>
					<select
						className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
						value={ tempTypeIndex }
						onChange={ ( e ) => ( gun.type = gunTypes[ parseInt( e.target.value, 10 ) ] )}
					>
						{ gunTypes.map( ( t, i ) => (
							<option key={ i } value={ i }>
								{ t.name } (r { t.rangeMin }-{ t.rangeMax } m)
							</option>
						))}
					</select>
				</label>

				<label className="grid gap-1">
					<span className="text-xs text-slate-600">Location distance (m) — S0→G</span>
					<input
						className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
						type="number"
						value={ gun.location.distance }
						onChange={ ( e ) => ( gun.location.distance = Math.max( 0, parseFloat( e.target.value || "0" ) ) ) }
						min={ 0 }
						step={ 1 }
					/>
				</label>

				<label className="grid gap-1">
					<span className="text-xs text-slate-600">Location azimuth (deg)</span>
					<input
						className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
						type="number"
						value={ gun.location.angle }
						onChange={ ( e ) => ( gun.location.angle = MathUtility.Get360Wrap( parseFloat( e.target.value || "0" ) ) ) }
						min={ 0 }
						max={ 360 }
						step={ 1 }
					/>
				</label>

				<div className="grid gap-2">
					<button
						className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
						onClick={onRemove}
					>
						Remove
					</button>
					<small className="text-slate-500">
						Aim: { gun.target.distance.toFixed( 1 ) } m @ { gun.target.angle.toFixed( 1 ) }°
						<br />
						r ≈ { gun.targetRadius.toFixed( 1 ) } m
					</small>
				</div>
			</div>
		);
	}
);
