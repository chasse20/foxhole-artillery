import { useEffect, useMemo, useState } from "react";

type Options = {
	min?: number;
	max?: number;
	sanitize?: ( tNumber: number ) => number;
	format?: ( tNumber: number ) => string;
};

export function NumberBind( get: () => number, set: ( tNumber: number ) => void, options: Options = {} ) 
{
	const { min, max, sanitize, format } = options;
	const current = get();
	const [ temp, setTemp ] = useState<string>( () => ( format ? format( current ) : String( current ) ) );

	useEffect( () => { setTemp( format ? format ( current ) : String (current ) ); }, [ current ] );

	// Clamp
	const clamp = ( tNumber: number ) => {
		let tempNumber = tNumber;
		if ( typeof min === "number" )
		{
			tempNumber = Math.max( min, tempNumber );
		}

		if ( typeof max === "number" )
		{
			tempNumber = Math.min( max, tempNumber );
		}

		return tempNumber;
	};

	// On every keystroke, update local string; only push valid numbers to model
	const onChange = ( e: React.ChangeEvent<HTMLInputElement> ) =>
	{
		const tempValue = e.target.value;
		setTemp( tempValue );

		const tempNumber = parseFloat( tempValue );
		if ( !Number.isNaN( tempNumber ) )
		{
			const tempCleaned = sanitize ? sanitize( tempNumber ) : tempNumber;
			set( clamp( tempCleaned ) );
		}
	};

	// On blur, normalize empty/invalid text back to the model value
	const onBlur = () =>
	{
		const tempNumber = parseFloat( temp );
		if ( temp.trim() === "" || Number.isNaN( tempNumber ) )
		{
			setTemp( format ? format( get() ) : String( get() ) );
		}
		else
		{
			const tempCleaned = clamp( sanitize ? sanitize( tempNumber ) : tempNumber );
			set( tempCleaned );
			setTemp( format ? format( tempCleaned ) : String( tempCleaned ) );
		}
	};

	return useMemo(
		() => (
			{
				value: temp,
				onChange,
				onBlur,
			}
		),
		[ temp ]
	);
}
