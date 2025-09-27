import { observer } from "mobx-react-lite";
import MathUtility from "../../Model/Utility/MathUtility";
import NumberInput from "./NumberInput";
import type WorldBind from "../../Model/FireControl/WorldBind";

export const WorldBindRow = observer(
	function WorldBindRow( props: { label: string; model: WorldBind; onRemove: () => void } )
	{
		const { label, model, onRemove } = props;

		return (
			<div className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-800/70 p-2">
				{/* Header (label + edit + delete) */}
				<div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
					<div className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-zinc-100">
						{ label }
					</div>

					{/* Square yellow edit button (replaces 'Change Icon') */}
					<button
						type="button"
						className="h-8 w-8 cursor-pointer rounded-md border border-amber-500/60 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
						onClick={ () => { model.IsSelecting = true; } }
						aria-label={ `Rebind ${ label } icon` }
						title="Rebind icon"
					>
						✎
					</button>

					<button
						type="button"
						className="h-8 w-8 cursor-pointer rounded-md border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
						onClick={ onRemove }
						aria-label={ `Remove ${ label }` }
						title={ `Remove ${ label }` }
					>
						×
					</button>
				</div>

				{/* Distance & Azimuth (same layout as GunRow) */}
				<div className="grid grid-cols-2 items-center gap-2">
					<label className="grid gap-1">
						<span className="text-[11px] uppercase tracking-wide text-zinc-400">Distance</span>
						<div className="relative">
							<NumberInput
								className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-10 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								step={ 1 }
								get={ () => model.coordinate.Distance }
								set={ ( n ) => ( model.coordinate.Distance = Math.max( 0, n ) ) }
								options={ { min: 0 } }
								aria-label={`${ label } relative distance to icon`}
							/>
							<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">m</span>
						</div>
					</label>

					<label className="grid gap-1">
						<span className="text-[11px] uppercase tracking-wide text-zinc-400">Azimuth</span>
						<div className="relative">
							<NumberInput
								className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-8 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								step={ 1 }
								get={ () => model.coordinate.Angle }
								set={ ( n ) => ( model.coordinate.Angle = MathUtility.Get360Wrap( n ) ) }
								options={ { min: 0 } }
								aria-label={`${ label } relative azimuth to icon`}
							/>
							<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">{"\u00B0"}</span>
						</div>
					</label>
				</div>
			</div>
		);
	}
);