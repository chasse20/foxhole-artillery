import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireControl/FireGroup";
import type Target from "../../Model/FireControl/Target";
import MathUtility from "../../Model/Utility/MathUtility";
import { NumberBind } from "../Hook/NumberBind";

export const TargetRow = observer(
	function TargetRow( props: { fireGroup: FireGroup; model: Target; index: number; onRemove: () => void; onSelect: () => void } )
	{
		const { fireGroup, model, index, onRemove, onSelect } = props;
		const tempIsActive = fireGroup.ActiveTarget === model;

		// Binds
		const tempDistanceBind = NumberBind(
			() => model.coordinate.Distance,
			(n) => (model.coordinate.Distance = Math.max(0, n)),
			{ min: 0 }
		);

		const tempAzimuthBind = NumberBind(
			() => model.coordinate.Angle,
			(n) => (model.coordinate.Angle = MathUtility.Get360Wrap(n)),
			{ sanitize: (n) => MathUtility.Get360Wrap(n) }
		);

		return (
			<div
				className={[
					"grid gap-2 rounded-md border p-2 bg-zinc-800/70 hover:bg-zinc-800/90",
					tempIsActive
						? "border-emerald-600/70"
						: "border-zinc-800",
					"cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
				].join(" ")}
				role="button"
				tabIndex={0}
				aria-pressed={tempIsActive}
				aria-label={`Select ${model.Name || "Target"} as active`}
				title={tempIsActive ? "Active target" : "Click to make active"}
				onClick={onSelect}
			>
				{/* Row 1: Header (name + controls) */}
				<div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
					<input
						className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-zinc-100 outline-none focus:border-zinc-700 focus:bg-zinc-900 focus:ring-0"
						value={model.Name}
						onChange={(e) => (model.Name = e.target.value)}
						aria-label={`Target ${index + 1} name`}
						placeholder="Target name"
						onClick={(e) => e.stopPropagation()}
					/>
					{tempIsActive && (
						<span className="px-2 py-0.5 text-xs rounded bg-emerald-600/20 text-emerald-300">
							Active
						</span>
					)}
					<button
						className="h-8 w-8 cursor-pointer rounded-md border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
						onClick={(e) => { e.stopPropagation(); onRemove(); }}
						aria-label="Remove target"
						title="Remove target"
						type="button"
					>
						×
					</button>
				</div>

				{/* Row 2: Distance & Azimuth */}
				<div className="grid grid-cols-2 items-center gap-2">
					<label className="grid gap-1" onClick={(e) => e.stopPropagation()}>
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

					<label className="grid gap-1" onClick={(e) => e.stopPropagation()}>
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
			</div>
		);
	}
);
