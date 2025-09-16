import React from "react";

type Options = {
	min?: number;
	max?: number;
	sanitize?: ( tNumber: number ) => number;
	format?: ( tNumber: number ) => string;
};

type Props = {
	get: () => number;
	set: ( tNumber: number ) => void;
	options?: Options;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur" | "type">;

type State = {
	value: string;
	model: number;
};

export default class NumberInput extends React.PureComponent<Props, State>
{
	constructor( props: Props )
	{
		super( props );

		const { format } = props.options ?? {};
		const current = props.get();
		this.state = {
			value: format ? format( current ) : String( current ),
			model: current
		};

		this.Clamp = this.Clamp.bind( this );
		this.OnChange = this.OnChange.bind( this );
		this.OnBlur = this.OnBlur.bind( this );
	}

	componentDidUpdate()
	{
		// If the external model changed elsewhere, re-sync local text
		const { format } = this.props.options ?? {};
		const current = this.props.get();

		if ( current !== this.state.model )
		{
			this.setState(
				{
					value: format ? format( current ) : String( current ),
					model: current
				}
			);
		}
	}

	protected Clamp( tNumber: number )
	{
		const { min, max } = this.props.options ?? {};
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
	}

	protected OnChange( tEvent: React.ChangeEvent<HTMLInputElement> )
	{
		const { sanitize, format } = this.props.options ?? {};
		const tempValue = tEvent.target.value;
		const tempNumber = parseFloat( tempValue );

		this.setState( { value: tempValue } );

		if ( !Number.isNaN( tempNumber ) )
		{
			const tempSanitized = sanitize ? sanitize( tempNumber ) : tempNumber;
			const tempCleaned = this.Clamp( tempSanitized );

			this.props.set( tempCleaned );

			if ( tempCleaned !== tempNumber )
			{
				this.setState(
					{
						value: format ? format( tempCleaned ) : String( tempCleaned ),
						model: tempCleaned
					}
				);
			}
			else
			{
				this.setState( { model: tempCleaned } );
			}
		}
	}

	protected OnBlur()
	{
		const { sanitize, format } = this.props.options ?? {};
		const tempText = this.state.value;
		const tempNumber = parseFloat( tempText );

		if ( tempText.trim() === "" || Number.isNaN( tempNumber ) )
		{
			const current = this.props.get();
			this.setState(
				{
					value: format ? format( current ) : String( current ),
					model: current
				}
			);
		}
		else
		{
			const tempCleaned = this.Clamp( sanitize ? sanitize( tempNumber ) : tempNumber );
			this.props.set( tempCleaned );
			this.setState(
				{
					value: format ? format( tempCleaned ) : String( tempCleaned ),
					model: tempCleaned
				}
			);
		}
	}

	render()
	{
		const { get, set, options, ...tempInputProps } = this.props;

		return (
			<input
				{ ...tempInputProps }
				type="number"
				value={ this.state.value }
				onChange={ this.OnChange }
				onBlur={ this.OnBlur }
			/>
		);
	}
}
