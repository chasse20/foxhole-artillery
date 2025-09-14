import { observer } from "mobx-react-lite";
import type Gun from "../../Model/FireControl/Gun";
import type GunType from "../../Model/FireControl/GunType";
import MathUtility from "../../Model/Utility/MathUtility";
import { NumberBind } from "../Hook/NumberBind";
import { useState } from "react";

export const GunRow = observer(
	function GunRow( props: { gun: Gun; gunTypes: GunType[]; onRemove: () => void } )
	{
		const { gun, gunTypes, onRemove } = props;
		const tempTypeIndex = Math.max( 0, gunTypes.indexOf( gun.Type ) );
		const [ copied, setCopied ] = useState( false );

		// Binds
		const tempDistanceBind = NumberBind(
			() => gun.location.Distance,
			( n ) => ( gun.location.Distance = Math.max( 0, n ) ),
			{ min: 0 }
		);
		const tempAzimuthBind = NumberBind(
			() => gun.location.Angle,
			( n ) => ( gun.location.Angle = MathUtility.Get360Wrap( n ) ),
			{ sanitize: ( n ) => MathUtility.Get360Wrap( n ) }
		);

		// Copy Aim
		const tempOnCopyAim = async () =>
		{
			try
			{
				await navigator.clipboard.writeText( gun.MessageText );
				setCopied( true );
				setTimeout( () => setCopied( false ), 1200 );
			}
			catch ( tError )
			{
				console.error( "Failed to copy aim text:", tError );
			}
		};

		// Render
		const tempIsClamped = Math.abs( gun.aim.Distance - gun.Type.rangeMin ) < 1e-6 || Math.abs( gun.aim.Distance - gun.Type.rangeMax ) < 1e-6;

		return (
			<div className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-800/70 p-2">
				{/* Name and delete */}
				<div className="grid grid-cols-[1fr_auto] items-center gap-2">
					<input
						className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-zinc-100 outline-none focus:border-zinc-700 focus:bg-zinc-900 focus:ring-0"
						value={ gun.Name }
						onChange={ ( e ) => ( gun.Name = e.target.value ) }
						aria-label="Gun name"
						placeholder="Gun name"
					/>

					<button
						className="h-8 w-8 cursor-pointer rounded-md border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
						onClick={ onRemove }
						aria-label="Remove gun"
						title="Remove gun"
					>
						×
					</button>
				</div>

				{/* Type */}
				<label className="grid gap-1">
					<span className="text-[11px] uppercase tracking-wide text-zinc-400">Type</span>
					<select
						className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						value={ Math.max( 0, gunTypes.indexOf( gun.Type ) ) }
						onChange={ ( e ) => ( gun.Type = gunTypes[ parseInt( e.target.value, 10) ] ) }
					>
						{ gunTypes.map(
							( tType, i ) => (
								<option key={ i } value={ i }>
									{ tType.name } ({ tType.rangeMin }-{ tType.rangeMax }m)
								</option>
							)
						) }
					</select>
				</label>

				{/* Distance and Azimuth */}
				<div className="grid grid-cols-2 items-center gap-2">
					<label className="grid gap-1">
						<span className="text-[11px] uppercase tracking-wide text-zinc-400">Distance</span>
						<div className="relative">
							<input
								className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-10 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								type="number"
								{ ...tempDistanceBind }
								min={ 0 }
								step={ 1 }
							/>
							<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">m</span>
						</div>
					</label>

					<label className="grid gap-1">
						<span className="text-[11px] uppercase tracking-wide text-zinc-400">Azimuth</span>
						<div className="relative">
							<input
								className="h-[40px] w-full rounded-md border border-zinc-700 bg-zinc-800 pr-10 pl-3 text-right text-base text-zinc-100 [font-variant-numeric:tabular-nums] shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								type="number"
								{ ...tempAzimuthBind }
								step={ 1 }
							/>
							<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-sm">{"\u00B0"}</span>
						</div>
					</label>
				</div>

				{/* Aim */}
				<fieldset
					className="relative rounded-md border border-emerald-700/50 bg-emerald-950/40 px-3 py-2 shadow-sm cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
					role="button"
					tabIndex={ 0 }
					aria-label={ `Copy aim for ${gun.Name || "Gun"}` }
					title="Click to copy aim to clipboard"
					onClick={ tempOnCopyAim }
				>
					<legend className="px-1 text-sm text-zinc-300">Aim</legend>

					{ copied && (
						<span className="absolute right-2 top-2 rounded bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-300">Copied!</span>
					) }

					<div className="flex items-baseline justify-center gap-6 text-4xl font-semibold [font-variant-numeric:tabular-nums]">
						<div className={ "whitespace-nowrap " + ( tempIsClamped ? "text-red-400" : "text-emerald-300" ) }>
							{gun.aim.Distance.toFixed(1)}
							<span className={ "ml-1 align-baseline text-lg " + ( tempIsClamped ? "text-red-300/80" : "text-emerald-400/80") }>m							</span>
						</div>

						<div className="whitespace-nowrap text-emerald-300">
							{ gun.aim.Angle.toFixed( 1 ) }
							<span className="ml-1 align-baseline text-lg text-emerald-400/80">{"\u00B0"}</span>
						</div>
					</div>
				</fieldset>
			</div>
		);
	}
);
