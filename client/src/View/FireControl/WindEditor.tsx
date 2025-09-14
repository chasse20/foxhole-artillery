import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireControl/FireGroup";
import MathUtility from "../../Model/Utility/MathUtility";
import { NumberBind } from "../Hook/NumberBind";

export const WindEditor = observer(
	function WindEditor( props: { fireGroup: FireGroup; } )
	{
		const { fireGroup } = props;

		const tempAzimuthBind = NumberBind(
			() => fireGroup.wind.Angle,
			( n ) => ( fireGroup.wind.Angle = MathUtility.Get360Wrap( n ) ),
			{ sanitize: ( n ) => MathUtility.Get360Wrap( n ) }
		);

		return (
			<fieldset className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
				<legend className="px-1 text-sm text-zinc-300">Wind</legend>

				<div className="grid grid-cols-2 items-end gap-2">
					<div className="grid gap-1">
						<span className="text-[11px] uppercase tracking-wide text-zinc-400">Strength</span>

						<div className="flex w-full">
							{ [ 0, 1, 2, 3, 4, 5 ].map(
								( tWindStrength, i, tArray ) =>
								{
									const tempIsActive = fireGroup.wind.Strength === tWindStrength;

									return (
										<button
											key={i}
											type="button"
											onClick={ () => ( fireGroup.wind.Strength = tWindStrength ) }
											disabled={ tempIsActive }
											aria-pressed={ tempIsActive }
											className={ [
												"h-[40px] flex-1 text-sm border cursor-pointer select-none",
												"text-center",
												i === 0 ? "rounded-l-md" : "rounded-none -ml-px",
												i === tArray.length - 1 && "rounded-r-md",
												tempIsActive
													? "z-10 border-indigo-500 bg-indigo-600 text-white shadow-sm"
													: "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
											].filter( Boolean ).join(" ") }
										>
											{ tWindStrength }
										</button>
									);
								}
							) }
						</div>
					</div>

					<label className="grid gap-1">
						<span className="text-[11px] uppercase tracking-wide text-zinc-400">Azimuth</span>
						<div className="relative">
							<input
								className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-8 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								type="number"
								{ ...tempAzimuthBind }
								step={ 1 }
							/>
							<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">{"\u00B0"}</span>
						</div>
					</label>
				</div>
			</fieldset>
		);
	}
);
