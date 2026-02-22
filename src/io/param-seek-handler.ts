import type { LoaderRange, SeekConfig, SeekHandler } from "./loader";

class ParamSeekHandler implements SeekHandler {
	private _startName: string;
	private _endName: string;

	constructor(paramStart: string, paramEnd: string) {
		this._startName = paramStart;
		this._endName = paramEnd;
	}

	getConfig(baseUrl: string, range: LoaderRange): SeekConfig {
		let url = baseUrl;

		if (range.from !== 0 || range.to !== -1) {
			let needAnd = true;
			if (url.indexOf("?") === -1) {
				url += "?";
				needAnd = false;
			}

			if (needAnd) {
				url += "&";
			}

			url += `${this._startName}=${range.from.toString()}`;

			if (range.to !== -1) {
				url += `&${this._endName}=${range.to.toString()}`;
			}
		}

		return {
			url: url,
			headers: {},
		};
	}

	removeURLParameters(seekedURL: string): string {
		const baseURL = seekedURL.split("?")[0];
		let params: string | undefined;

		const queryIndex = seekedURL.indexOf("?");
		if (queryIndex !== -1) {
			params = seekedURL.substring(queryIndex + 1);
		}

		let resultParams = "";

		if (params !== undefined && params.length > 0) {
			const pairs = params.split("&");

			for (let i = 0; i < pairs.length; i++) {
				const pair = pairs[i].split("=");
				const requireAnd = i > 0;

				if (pair[0] !== this._startName && pair[0] !== this._endName) {
					if (requireAnd) {
						resultParams += "&";
					}
					resultParams += pairs[i];
				}
			}
		}

		return resultParams.length === 0 ? baseURL : `${baseURL}?${resultParams}`;
	}
}

export default ParamSeekHandler;
