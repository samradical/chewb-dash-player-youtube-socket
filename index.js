const SOCKET_SERVER = "http://0.0.0.0:8080"

import IO from 'socket.io-client';
import Q from 'bluebird';
import _ from 'lodash';
import Signals from 'signals';

const DEFAULTS = {
	quality: {
		resolution: '360p'
	},
	itags:["136"]
}


import {
	Cache,
} from './utils'

import SocketService from './socketService'
import YotubeApi from './youtubeApi'

export default class DashPlayerYoutubeSocket extends SocketService {
	constructor(socketIo, options = {}) {
		super(socketIo)
		this._options = _.assign({}, options, DEFAULTS)
		if (!socketIo) {
			this.socket = IO(SOCKET_SERVER)
		} else {
			this.socket = socketIo
		}
		this.youtube = new YotubeApi(this.socket)
	}

	getVideoInfo(params) {
		return this.youtube.video(params)
	}

	getManifest(type, videoId, uuid, options = {}) {
		uuid = uuid || this.getUUID(type, videoId)
		return new Q((yes, no) => {
			let _existingManifest = Cache.getSidxManifest(uuid)
			if (_existingManifest) {
				yes(_existingManifest)
			} else {
				yes(this._getSidx(
						videoId,
						this._getSidxOptions(
							type,
							videoId,
							options
						)
					).then(manifest => {
						console.log("Got manifest");
						console.log(manifest);
						Cache.setSidxManifest(uuid, manifest)
						return manifest
					})
				)
			}
		})
	}

	getIndexBuffer(
		uuid,
		url,
		range,
		options = {
			youtubeDl: true,
			isIndexRange: true,
			uuid: uuid,
		}) {

		return this._getSocketVideoRange(
			_.assign({}, {
				uuid: uuid,
				url: url,
				range: range
			}, options)
		).then(buffer => {
			Cache.copySetIndexBuffer(uuid, buffer)
			return buffer
		})

	}

	getRangeBuffer(uuid,
		url,
		range,
		options = {
			youtubeDl: true
		}) {

		return this._getSocketVideoRange(
			_.assign({}, {
				uuid: uuid,
				url: url,
				range: range
			}, options)
		)

	}

	getUUID(type, videoId) {
		return `${type}:${videoId}:${this.sidxResolution}`
	}

	get sidxResolution() {
		return this._options.quality.resolution
	}

	get options() {
		return this._options
	}

	get quality() {
		return this._options.quality
	}

	_getSidx(vId, options = {}) {
		return this
			.getSidx(_.assign({}, options, { id: vId }))
			.then(sidx => {
				return sidx
			})
	}

	_getSidxOptions(type, videoId, options = {}) {
		return _.assign({}, {
			videoOnly: (type === 'video'),
			audioOnly: (type === 'audio'),
			uuid: this.getUUID(type, videoId)
		}, options)
	}

	_getSocketVideoRange(options) {
		return this.getVideoRange(options)
	}

	_log(str) {
		if (this._options.verbose) {
			console.log(str);
		}
	}

}
