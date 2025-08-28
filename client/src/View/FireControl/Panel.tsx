import { observer } from "mobx-react-lite";
import { useApp } from "../AppContext";
import { FireGroup } from "./FireGroup";

export const Panel = observer(
	function Panel()
	{
		const tempApp = useApp();

		return (
			<aside
				className="
					leftpanel
					fixed left-0 top-0 z-40
					h-screen w-[450px]
					overflow-y-auto border-r border-zinc-800
					bg-zinc-900 p-3 shadow-xl text-zinc-100
				"
			>
				<header className="flex items-center justify-between">
					<h2 className="m-0 text-lg font-semibold tracking-tight">Fire Groups</h2>
					<button
						className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
						onClick={() => tempApp.AddFireGroup()}
					>
						+ Add group
					</button>
				</header>

				<div className="mt-3 grid gap-3">
					{tempApp.fireGroups.map((tFireGroup, tIndex) => (
						<FireGroup
							key={tIndex}
							model={tFireGroup}
							onRemove={() => tempApp.RemoveFireGroup(tIndex)}
							gunTypes={tempApp.gunTypes}
						/>
					))}
				</div>
			</aside>
		);
	}
);
