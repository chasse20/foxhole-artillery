import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireGroup";
import MathUtility from "../../Model/Utility/MathUtility";
import { NumberBind } from "../Hook/NumberBind";

export const TargetEditor = observer(
	function TargetEditor( props: { fireGroup: FireGroup; } )
	{
		const { fireGroup } = props;

		const tempDistanceBind = NumberBind(
			() => fireGroup.targetFromSpotter.Distance,
			(n) => (fireGroup.targetFromSpotter.Distance = Math.max(0, n)),
			{ min: 0 }
		);

		const tempAzimuthBind = NumberBind(
			() => fireGroup.targetFromSpotter.Angle,
			(n) => (fireGroup.targetFromSpotter.Angle = MathUtility.Get360Wrap(n)),
			{ sanitize: (n) => MathUtility.Get360Wrap(n) }
		);

		return (
			<fieldset className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
				<legend className="px-1 text-sm text-zinc-300">Target (from Sn)</legend>

				<div className="grid grid-cols-2 items-end gap-2">
					<label className="grid gap-1">
						<span className="text-[11px] uppercase tracking-wide text-zinc-400">Distance</span>
						<div className="relative">
							<input
								className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-10 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								type="number"
								step={1}
								min={0}
								{...tempDistanceBind}
							/>
							<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">
								m
							</span>
						</div>
					</label>

					<label className="grid gap-1">
						<span className="text-[11px] uppercase tracking-wide text-zinc-400">Azimuth</span>
						<div className="relative">
							<input
								className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-8 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								type="number"
								{...tempAzimuthBind}
							/>
							<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">
								{"\u00B0"}
							</span>
						</div>
					</label>
				</div>
			</fieldset>
		);
	}
);
