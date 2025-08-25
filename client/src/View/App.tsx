import { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import AppModel from "../Model/App";
import { AppContext } from "./AppContext";
import { LeftPanel } from "./LeftPanel";

const App = observer(
	function App()
	{
		const tempModel = useMemo( () => new AppModel(), [] );
		useEffect( () => () => tempModel.Dispose(), [ tempModel ] );

		return (
			<AppContext.Provider value={tempModel}>
				<div className="grid min-h-screen grid-cols-[360px_1fr]">
				<LeftPanel />
				<main className="p-4">
					<h1 className="text-2xl font-semibold">Artillery Planner</h1>
					<p className="text-slate-600">Canvas omitted. Use the left panel.</p>
				</main>
				</div>
			</AppContext.Provider>
		);
	}
);

export default App;
