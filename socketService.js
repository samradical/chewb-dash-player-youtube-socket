import Q from 'bluebird';
import Signals from 'signals';
import { ERROR_TYPES } from 'dash-player-errortypes'

const YOUTUBE_DEFAULTS = {
	maxResults: 50
};


const SOCKET_EVENTS = {
	ON_BUFFER_CHUNK: 'ON_BUFFER_CHUNK'
}

import {
	Cache,
	Utils,
} from './utils'


export { SOCKET_EVENTS }

export default class SocketService {

	constructor(ioClient, options) {
		this.sidxs = {}
		this._events = {}
	}

	_getCacheKey(options) {
		return options.uuid
	}

	_getCache(options) {
		let key = this._getCacheKey(options)
		let _s = this.sidxs[key] || {}
		this.sidxs[key] = _s
		return this.sidxs[key]
	}

	_appendBuffer(buffer1, buffer2) {
		var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
		tmp.set(new Uint8Array(buffer1), 0);
		tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
		return tmp;
	}

	on(str, cb) {
		this._events[str] = cb
	}

	getSidx(options) {
		return new Q((yes, no) => {
			let _s = `rad:youtube:sidx:${options.uuid}:resp`
			let _existing = this._getCache(options)
			this.socket.removeListener(_s, _existing.indexResp)

			if (_existing.sidx) {
				return yes(_existing.sidx)
			}
			_existing.indexResp = (data) => {
				this.socket.removeListener(_s, _existing.indexResp)
				if (!data.error && data) {
					if (data) {
						_existing.sidx = data
						yes(_existing.sidx)
					} else {
						_existing.sidx = data
						yes(_existing.sidx)
					}
				} else {
					no(Utils.getError(ERROR_TYPES.SIDX, JSON.stringify(data)))
				}
			}
			this.socket.on(_s, _existing.indexResp)
			this.socket.emit('rad:youtube:sidx', options)
		})
	}

	getVideoRange(options) {
		return new Q((yes, no) => {
			let _buffer

			/*
			Get from cache
			*/
			if (options.isIndexRange) {
				let _indexBuffer = Cache.getIndexBuffer(options.uuid)
				if (_indexBuffer) {
					yes(_indexBuffer)
					return
				}
			}
			//bolth on the totalbytes
			let _totalBytes = parseInt(options.range.split('-')[1], 10)
			let _bytes = 0
				//options.totalBytes = _totalBytes

			let _existing = this._getCache(options)
			let _s = `rad:youtube:range:${options.uuid}:resp`
			let _e = `rad:youtube:range:${options.uuid}:end`
			this.socket.removeListener(_s, _existing.rangeResp)
			this.socket.removeListener(_e, _existing.rangeEnd)

			_existing.rangeResp = (data) => {
				_bytes += data.byteLength
				let _rangeCallback = this._events[SOCKET_EVENTS.ON_BUFFER_CHUNK]
				if (_rangeCallback) {
					_rangeCallback(data, _bytes / _totalBytes)
				}
				let _b = new Uint8Array(data)
				if (!_buffer) {
					_buffer = _b
				} else {
					_buffer = this._appendBuffer(_buffer, _b)
				}
			}

			_existing.rangeEnd = () => {
				yes(_buffer.buffer)
			}

			this.socket.on(_s, _existing.rangeResp)
			this.socket.on(_e, _existing.rangeEnd)
			this.socket.emit('rad:youtube:range', options)
		})
	}

	/*addVideo(obj) {
		this.socket.emit('rad:video:save', obj)
	}

	saveVideo() {
		this.socket.emit('rad:video:save:end')
	}*/
}
