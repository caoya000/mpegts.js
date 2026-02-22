import type { LoaderRange, SeekConfig, SeekHandler } from "./loader";

class RangeSeekHandler implements SeekHandler {
	private _zeroStart: boolean;

	constructor(zeroStart?: boolean) {
		this._zeroStart = zeroStart || false;
	}

	getConfig(url: string, range: LoaderRange): SeekConfig {
		const headers: Record<string, string> = {};

		if (range.from !== 0 || range.to !== -1) {
			let param: string;
			if (range.to !== -1) {
				param = `bytes=${range.from.toString()}-${range.to.toString()}`;
			} else {
				param = `bytes=${range.from.toString()}-`;
			}
			headers.Range = param;
		} else if (this._zeroStart) {
			headers.Range = "bytes=0-";
		}

		return {
			url: url,
			headers: headers,
		};
	}

	removeURLParameters(seekedURL: string): string {
		return seekedURL;
	}
}

export default RangeSeekHandler;
