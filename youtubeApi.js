import Q from 'bluebird';
import Xhr from 'xhr-request';
import Signals from 'signals';
import { ERROR_TYPES } from 'dash-player-errortypes'

const YOUTUBE_DEFAULTS = {
	maxResults: 50
};

const hasAccessToken = (options => {
	return !!options.access_token
})

import {
	Cache,
	Utils,
} from './utils'

const clientGetRequest = (url, options = {}) => {
	return new Q((yes, no) => {
		Xhr(url, {
			json: true,
			query: options
		}, (err, data) => {
			if (err) {
				no(err)
			} else {
				yes(data)
			}
		})
	})
}

export default class YoutubeApi {

	constructor(socket) {
		this.socket = socket

		//this._onSeachResponseBound = this._onSeachResponse.bind(this)
	}



	playlistItems(options) {

		let params = _.assign({}, {
			part: 'snippet',
			videoDuration: 'any',
			maxResults: 50,
			type: 'video',
			pageToken: null,
			safeSearch: 'none'
		}, YOUTUBE_DEFAULTS, options)

		console.log(params);

		console.log(hasAccessToken(options));

		if (hasAccessToken(options)) {
			return clientGetRequest('https://www.googleapis.com/youtube/v3/playlistItems', params)
		}

		return new Q((yes, no) => {
			let _self = this
			let _items = []

			let _loop = (nextPageToken = null) => {

				let _s = `rad:youtube:playlist:${options.playlistId}:items:resp`
				this.socket.on(_s, function(data) {
					if (data.error) {
						no(new Error(data.error.message))
					} else {
						_self.socket.removeListener(_s, arguments[0].callee)
						_items = [..._items, ...data.items]
						console.log(data.pageToken);
						if (data.pageToken) {
							_loop(data.pageToken)
						} else {
							data.items = _items
							yes(data)
						}
					}
				});

				this.socket.emit('rad:youtube:playlist:items', params)

			}

			_loop()
		})
	}

	search(options) {

		let params = _.assign({}, {
			part: 'snippet',
			videoDuration: 'any',
			maxResults: 50,
			type: 'video',
			safeSearch: 'none'
		}, YOUTUBE_DEFAULTS, options)

		if (hasAccessToken(options)) {
			return clientGetRequest('https://www.googleapis.com/youtube/v3/search', params)
		}

		return new Q((yes, no) => {
			let _self = this

			let _s = `rad:youtube:search:resp`
			this.socket.on(_s, function(results) {
				_self.socket.removeListener(_s, arguments[0].callee)
				if (results.error) {
					no(results.error)
				} else {
					yes(results)
				}
			})
			this.socket.emit('rad:youtube:search', params)
		})
	}

	video(options) {

		let params = _.assign({}, {
			part: 'snippet',
		}, options)

		if (hasAccessToken(options)) {
			return clientGetRequest('https://www.googleapis.com/youtube/v3/videos', params)
		}

		return new Q((yes, no) => {
			let _self = this

			let _s = `rad:youtube:video:resp`
			this.socket.on(_s, function(results) {
				_self.socket.removeListener(_s, arguments[0].callee)
				yes(results)
			})
			this.socket.emit('rad:youtube:video', params)
		})
	}

}
