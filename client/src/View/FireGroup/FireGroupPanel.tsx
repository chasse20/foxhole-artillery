import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireGroup";
import type GunType from "../../Model/GunType";
import { WindEditor } from "./WindEditor";
import { SpottersEditor } from "./SpottersEditor";
import { GunsEditor } from "./GunsEditor";
import { TargetEditor } from "./TargetEditor";

export const FireGroupPanel = observer(
	function FireGroupPanel( props: { model: FireGroup; gunTypes: GunType[]; onRemove: () => void; } )
	{
		const { model, onRemove, gunTypes } = props;

		return (
			<section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
				<div
					role="button"
					tabIndex={0}
					className="grid grid-cols-[1fr_auto] items-center gap-2 w-full cursor-pointer bg-zinc-800/70 px-3 py-2 hover:bg-zinc-800"
					onClick={(e) => { e.preventDefault(); model.ToggleVisible(); }}
					title="Toggle expand"
				>
					<div className="min-w-0">
						<input
							className="w-full truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-zinc-100 outline-none focus:border-zinc-700 focus:bg-zinc-900 focus:ring-0"
							value={model.Name}
							onClick={(e) => e.stopPropagation()}
							onChange={(e) => (model.Name = e.target.value)}
							aria-label="Fire group name"
							placeholder="Fire Group"
						/>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<button
							className="h-8 w-8 cursor-pointer rounded-md border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
							onClick={(e) => { e.stopPropagation(); onRemove(); }}
							aria-label="Remove fire group"
						>
							×
						</button>
						<span className="text-zinc-400">{model.IsVisible ? "▾" : "▸"}</span>
					</div>
				</div>

				{model.IsVisible && (
					<div className="grid gap-3 p-3">
						<WindEditor fireGroup={model} />
						<TargetEditor fireGroup={model} />
						<SpottersEditor fireGroup={model} />
						<GunsEditor fireGroup={model} gunTypes={gunTypes} />
					</div>
				)}
			</section>
		);
	}
);
