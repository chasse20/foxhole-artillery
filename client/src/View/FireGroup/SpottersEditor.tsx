import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireGroup";
import { SpotterRow } from "./SpotterRow";

export const SpottersEditor = observer(
	function SpottersEditor( props: { fireGroup: FireGroup } )
	{
		const { fireGroup } = props;

		return (
			<fieldset className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
				<legend className="px-1 text-sm text-zinc-300">Spotter Chain</legend>

				<div className="grid gap-2">
					{fireGroup.spotters.map((leg, i) => (
						<SpotterRow
							key={i}
							index={i}
							leg={leg}
							onRemove={() => fireGroup.RemoveSpotter(i)}
						/>
					))}

					<div>
						<button
							className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
							onClick={() => fireGroup.AddSpotter()}
						>
							+ Add leg
						</button>
					</div>
				</div>
			</fieldset>
		);
	}
);
