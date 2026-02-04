import type Icon from "../../Model/Map/Icon";
import { TeamType } from "../../Model/Map/TeamType";

export default class WorldMapCache
{
	public readonly cachedImages: Map<string, HTMLImageElement> = new Map();
	public readonly cachedIcons: Map<string, HTMLCanvasElement> = new Map();

	public LoadImage( tURL: string, tCallback: () => void ): HTMLImageElement
	{
		let tempImage = this.cachedImages.get( tURL ) ?? null;

		if ( tempImage == null )
		{
			tempImage = new Image();
			tempImage.decoding = "async";
			tempImage.loading = "eager";
			tempImage.addEventListener( "load", tCallback, { once: true } );
			tempImage.src = tURL;

			this.cachedImages.set( tURL, tempImage );
		}

		return tempImage;
	}

	public LoadIcon( tImage: HTMLImageElement, tIcon: Icon ): HTMLCanvasElement
	{
		const tempKey = tIcon.Type + "_" + tIcon.Team;
		let tempIcon = this.cachedIcons.get( tempKey ) ?? null;

		if ( tempIcon == null )
		{
			tempIcon = document.createElement( "canvas" );
			const tempWidth = Math.max( 1, tImage.naturalWidth );
			const tempHeight = Math.max( 1, tImage.naturalHeight );
			tempIcon.width = tempWidth;
			tempIcon.height = tempHeight;

			const tempContext = tempIcon.getContext( "2d", { willReadFrequently: false } )!;
			tempContext.globalCompositeOperation = "source-over";
			tempContext.clearRect( 0, 0, tempWidth, tempHeight );
			tempContext.drawImage( tImage, 0, 0, tempWidth, tempHeight );

			// Color
			tempContext.globalCompositeOperation = "multiply";
			tempContext.fillStyle = tIcon.Team == TeamType.Neutral ? "rgba(255,255,255,1)" : ( tIcon.Team == TeamType.Warden ? "rgba(72,125,169,1)" : "rgba(101,135,94,1)" );
			tempContext.fillRect( 0, 0, tempWidth, tempHeight );

			// Alpha
			tempContext.globalCompositeOperation = "destination-in";
			tempContext.drawImage( tImage, 0, 0, tempWidth, tempHeight );

			this.cachedIcons.set( tempKey, tempIcon );
		}

		return tempIcon;
	}
}
