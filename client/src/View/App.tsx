import { observer } from "mobx-react-lite";
import { AppContext, appSingleton } from "./AppContext";
import { Panel } from "./FireControl/Panel";

const App = observer(
	function App()
	{
		return (
			<AppContext.Provider value={ appSingleton }>
				<main className="relative h-screen w-screen overflow-hidden bg-neutral-900">
					<Panel />

				</main>
			</AppContext.Provider>
		);
	}
);

export default App;
