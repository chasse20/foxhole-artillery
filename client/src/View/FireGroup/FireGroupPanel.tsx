import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireGroup";
import type GunType from "../../Model/GunType";
import type WindStrength from "../../Model/WindStrength";
import { WindEditor } from "./WindEditor";
import { SpottersEditor } from "./SpottersEditor";
import { GunsEditor } from "./GunsEditor";
import MathUtility from "../../Model/Utility/MathUtility";

export const FireGroupPanel = observer(
	function FireGroupPanel( props: { model: FireGroup; gunTypes: GunType[]; windStrengths: WindStrength[]; onRemove: () => void; } )
	{
		const { model, onRemove, gunTypes, windStrengths } = props;

		return (
			<section className="overflow-hidden rounded-lg border border-slate-200">
				<div
					role="button"
					tabIndex={ 0 }
					className="flex w-full cursor-pointer items-center justify-between bg-slate-50 px-3 py-2 hover:bg-slate-100"
					onClick={ ( e ) => { e.preventDefault(); model.isVisible = !model.isVisible; } }
					title="Toggle expand"
				>
					<div className="flex items-center gap-2">
						<span className="font-medium">Fire Group</span>
						<small className="text-slate-500">
							{ model.guns.length } guns • { model.spotters.length } legs
						</small>
					</div>
					<div className="flex items-center gap-2">
						<button
							className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-sm text-rose-700 hover:bg-rose-100"
							onClick={ ( e ) => { e.stopPropagation(); onRemove(); } }
						>
							Remove
						</button>
						<span className="text-slate-500">{ model.isVisible ? "▾" : "▸" }</span>
					</div>
				</div>

				{ model.isVisible && (
					<div className="grid gap-3 p-3">
						<WindEditor fireGroup={ model } windStrengths={ windStrengths } />

						<fieldset className="rounded-md border border-slate-200 p-3">
							<legend className="px-1 text-sm text-slate-600">Target (from Sn)</legend>
							<div className="grid grid-cols-2 gap-2">
								<label className="grid gap-1">
									<span className="text-xs text-slate-600">Distance (m)</span>
									<input
										className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
										type="number"
										value={ model.targetFromSpotter.distance }
										onChange={ ( e ) => ( model.targetFromSpotter.distance = Math.max( 0, parseFloat( e.target.value || "0" ) ) ) }
										min={ 0 }
										step={ 1 }
									/>
								</label>

								<label className="grid gap-1">
									<span className="text-xs text-slate-600">Azimuth (deg)</span>
									<input
										className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
										type="number"
										value={ model.targetFromSpotter.angle }
										onChange={ ( e ) => ( model.targetFromSpotter.angle = MathUtility.Get360Wrap( parseFloat( e.target.value || "0" ) ) ) }
										min={ 0 }
										max={ 360 }
										step={ 1 }
									/>
								</label>
							</div>
						</fieldset>

						<SpottersEditor fireGroup={ model } />
						<GunsEditor fireGroup={ model } gunTypes={ gunTypes } />
					</div>
				)}
			</section>
		);
	}
);
