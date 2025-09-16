import { observer } from "mobx-react-lite";
import MathUtility from "../../Model/Utility/MathUtility";
import type PolarCoordinate from "../../Model/FireControl/PolarCoordinate";
import NumberInput from "./NumberInput";

export const SpotterRow = observer(
	function SpotterRow( props: { index: number; leg: PolarCoordinate; onRemove: () => void; } )
	{
		const { index, leg, onRemove } = props;

		// Render
		return (
			<div className="grid grid-cols-[1fr_1fr_auto] items-center gap-x-2 gap-y-1">
				{/* Labels */}
				<span className="col-start-1 text-[11px] uppercase tracking-wide text-zinc-400">{`S${ index + 1 }->S${ index } Distance`}</span>
				<span className="col-start-2 text-[11px] uppercase tracking-wide text-zinc-400">Azimuth</span>
				<span className="col-start-3" />

				{/* Inputs and delete */}
				<div className="col-start-1 relative">
					<NumberInput
						className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-10 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						step={ 1 }
						get={ () => leg.Distance }
						set={ ( n ) => ( leg.Distance = Math.max( 0, n ) ) }
						options={ { min: 0 } }
						aria-label="Distance"
					/>
					<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">m</span>
				</div>

				<div className="col-start-2 relative">
					<NumberInput
						className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-8 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						step={ 1 }
						get={ () => leg.Angle }
						set={ ( n ) => ( leg.Angle = MathUtility.Get360Wrap( n ) ) }
						options={ { min: 0 } }
						aria-label="Azimuth"
					/>
					<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">{"\u00B0"}</span>
				</div>

				<div className="col-start-3 flex items-center justify-start">
					<button
						className="h-8 w-8 cursor-pointer rounded-md border border-red-500/55 bg-red-500/15 text-red-400 hover:bg-red-500/20"
						onClick={ onRemove }
						aria-label={ `Remove S${ index + 1 }->S${ index } leg` }
						title="Remove leg"
					>
						×
					</button>
				</div>
			</div>
		);
	}
);
