import { observer } from "mobx-react-lite";
import type FireGroup from "../../Model/FireControl/FireGroup";
import type GunType from "../../Model/FireControl/GunType";
import { GunRow } from "./GunRow";
import { useState } from "react";

export const GunsEditor = observer(
	function GunsEditor( props: { fireGroup: FireGroup; gunTypes: GunType[] } )
	{
		const { fireGroup, gunTypes } = props;
		const [ isCopied, setIsCopied ] = useState( false );

		// Copy Aim
		const tempOnCopyAim = async () =>
		{
			try
			{
				await navigator.clipboard.writeText( fireGroup.MessageText );
				setIsCopied( true );
				setTimeout( () => setIsCopied( false ), 1200 );
			}
			catch ( tError )
			{
				console.error( "Failed to copy aim text:", tError );
			}
		};

		// Render
		return (
			<fieldset className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
				<legend className="px-1 text-sm text-zinc-300">Guns</legend>
				<div className="grid gap-2">
					{ fireGroup.guns.map(
						( tGun, i ) => (
							<GunRow
								key={ i }
								gun={ tGun }
								gunTypes={ gunTypes }
								onRemove={ () => fireGroup.RemoveGun( i ) }
							/>
						)
					) }
					<div className="flex flex-wrap items-center gap-2 pt-1">
						<button
							className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
							onClick={ () => fireGroup.AddGun( gunTypes[0] ) }
						>
							+ Add gun
						</button>
						<button
							className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
							aria-label="Copy aim"
							title="Click to copy aim to clipboard"
							onClick={ tempOnCopyAim }
						>
							Copy All Aims
						</button>
						{ isCopied && (
							<span className="rounded bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-300">Copied!</span>
						) }
					</div>
				</div>
			</fieldset>
		);
	}
);
