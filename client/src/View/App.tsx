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
			<AppContext.Provider value={ tempModel }>
				<main className="relative h-screen w-screen overflow-hidden bg-neutral-900">
					<LeftPanel />
				</main>
			</AppContext.Provider>
		);
	}
);

export default App;
