import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireControl/FireGroup";
import { WorldBindRow } from "./WorldBindRow";

export const WorldBindEditor = observer(
	function WorldBindEditor( props: { fireGroup: FireGroup } )
	{
		const { fireGroup } = props;
		const tempBase = fireGroup.baseWorldBind;
		const tempSpotter = fireGroup.spotterWorldBind;

		return (
			<fieldset className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 ">
				<legend className="px-1 text-sm text-zinc-300">World Binds</legend>

				<div className="grid gap-2">
					{/* Base Bind */}
					{ tempBase.Icon == null ? (
						<div>
							<button
								type="button"
								className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
								onClick={ () => { tempBase.IsSelecting = true; } }
								aria-label={ tempBase.IsSelecting ? "Selecting Base..." : "Add Base" }
								title={ tempBase.IsSelecting ? "Selecting Base..." : "Add Base" }
							>
								{ tempBase.IsSelecting ? "Selecting Base..." : "+ Base" }
							</button>
						</div>
					) : (
						<WorldBindRow
							label="Base"
							model={ tempBase }
							onRemove={ () => fireGroup.ClearWorldBinds() }
						/>
					) }

					{/* Spotter Bind only appears when Base Bind is set */}
					{ tempBase.Icon != null && (
						tempSpotter.Icon == null ? (
							<div>
								<button
									type="button"
									className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
									onClick={ () => { tempSpotter.IsSelecting = true; } }
									aria-label={ tempSpotter.IsSelecting ? "Selecting Spotter..." : "Add Spotter" }
									title={ tempSpotter.IsSelecting ? "Selecting Spotter..." : "Add Spotter" }
								>
									{ tempSpotter.IsSelecting ? "Selecting Spotter..." : "+ Spotter" }
								</button>
							</div>
						) : (
							<WorldBindRow
								label="Spotter"
								model={ tempSpotter }
								onRemove={ () => { tempSpotter.Icon = null; } }
							/>
						)
					) }
				</div>
			</fieldset>
		);
	}
);
