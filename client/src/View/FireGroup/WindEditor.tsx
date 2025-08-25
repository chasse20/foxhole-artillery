import { observer } from "mobx-react-lite";
import type WindStrength from "../../Model/WindStrength";
import type FireGroup from "../../Model/FireGroup";
import MathUtility from "../../Model/Utility/MathUtility";

export const WindEditor = observer(
	function WindEditor( props: { fireGroup: FireGroup; windStrengths: WindStrength[] } )
	{
		const { fireGroup, windStrengths } = props;

		return (
			<fieldset className="rounded-md border border-slate-200 p-3">
				<legend className="px-1 text-sm text-slate-600">Wind</legend>

				<div className="grid grid-cols-2 gap-2">
					<label className="grid gap-1">
						<span className="text-xs text-slate-600">Azimuth</span>
						<input
							className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
							type="number"
							value={ fireGroup.wind.angle }
							onChange={ ( e ) => ( fireGroup.wind.angle = MathUtility.Get360Wrap( parseFloat( e.target.value || "0" ) ) ) }
							min={ 0 }
							max={ 360 }
							step={ 1 }
						/>
					</label>

					<div className="grid gap-1">
						<span className="text-xs text-slate-600">Strength</span>
						<div className="flex flex-wrap gap-2">
							{ windStrengths.map( ( ws, i ) => (
								<button
									key={ i }
									type="button"
									disabled={ fireGroup.wind.strength === ws }
									className="rounded-full px-3 py-1 text-sm border"
									onClick={() => fireGroup.wind.strength = ws }
								>
									{ ws.name }
								</button>
							))}
						</div>
					</div>
				</div>
			</fieldset>
		);
	}
);
