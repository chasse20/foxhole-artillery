import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireGroup";
import { TargetRow } from "./TargetRow";

export const TargetEditor = observer(
	function TargetEditor( props: { fireGroup: FireGroup } )
	{
		const { fireGroup } = props;

		return (
			<fieldset className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
				<legend className="px-1 text-sm text-zinc-300">Targets</legend>

				<div className="grid gap-2">
					{fireGroup.targets.map((t, i) => (
						<TargetRow
							key={i}
							fireGroup={fireGroup}
							model={t}
							index={i}
							onRemove={() => fireGroup.RemoveTarget(i)}
							onSelect={() => fireGroup.ActiveTarget = t}
						/>
					))}

					<div>
						<button
							className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
							onClick={() => { fireGroup.AddTarget(); }}
						>
							+ Add target
						</button>
					</div>
				</div>
			</fieldset>
		);
	}
);
