import { observer } from "mobx-react-lite";
import { useApp } from "./AppContext";
import { FireGroupPanel } from "./FireGroup/FireGroupPanel";

export const LeftPanel = observer(
	function LeftPanel()
	{
		const tempApp = useApp();

		return (
			<aside className="h-screen overflow-y-auto border-r border-slate-200 p-3">
				<header className="flex items-center justify-between">
					<h2 className="m-0 text-lg font-semibold">Fire Groups</h2>
					<button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700" onClick={ () => tempApp.AddFireGroup() }>
						+ Add group
					</button>
				</header>
				<div className="mt-3 grid gap-2">
					{
						tempApp.fireGroups.map(
							( tFireGroup, tIndex ) =>
								<FireGroupPanel
									key={ tIndex }
									model={ tFireGroup }
									onRemove={ () => tempApp.RemoveFireGroup( tIndex ) }
									gunTypes={ tempApp.gunTypes }
									windStrengths={ tempApp.windStrengths }
								/>
						)
					}
				</div>
			</aside>
		);
	}
);
