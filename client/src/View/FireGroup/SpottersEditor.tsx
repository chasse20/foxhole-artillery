import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireGroup";
import MathUtility from "../../Model/Utility/MathUtility";

export const SpottersEditor = observer(
	function SpottersEditor( props: { fireGroup: FireGroup } )
	{
		const { fireGroup } = props;

		return (
			<fieldset className="rounded-md border border-slate-200 p-3">
				<legend className="px-1 text-sm text-slate-600">Spotter legs (S(i+1) → S(i))</legend>

				<div className="grid gap-2">
					{ fireGroup.spotters.map( ( tempLeg, tempIndex ) => (
						<div key={ tempIndex } className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
							<label className="grid gap-1">
								<span className="text-xs text-slate-600">
									{ `Leg S${tempIndex + 1}→S${tempIndex} Dist (m)` }
								</span>
								<input
									className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
									type="number"
									value={ tempLeg.distance }
									onChange={ ( e ) => ( tempLeg.distance = Math.max( 0, parseFloat( e.target.value || "0" ) ) ) }
									min={ 0 }
									step={ 1 }
								/>
							</label>

							<label className="grid gap-1">
								<span className="text-xs text-slate-600">Azimuth (deg)</span>
								<input
									className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
									type="number"
									value={ tempLeg.angle }
									onChange={ ( e ) => ( tempLeg.angle = MathUtility.Get360Wrap( parseFloat( e.target.value || "0" ) ) ) }
									min={ 0 }
									max={ 360 }
									step={ 1 }
								/>
							</label>

							<button
								className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50"
								onClick={ () => fireGroup.RemoveSpotter( tempIndex ) }
							>
								Remove
							</button>
						</div>
					))}

					<div>
						<button
							className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
							onClick={ () => fireGroup.AddSpotter() }
						>
							+ Add leg
						</button>
					</div>
				</div>
			</fieldset>
		);
	}
);
