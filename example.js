const YoutubeSocket = require('./index')
let VoUtils = require('dash-player-voutils')
let _socket = new YoutubeSocket.default()

console.log("Fetching", 'audio', 'Mb3iPP-tHdA');
_socket.getManifest('audio', 'Mb3iPP-tHdA')
  .then(manifest => {
    let _uuid = VoUtils.getUUID('audio', 'Mb3iPP-tHdA')

    let _vo = VoUtils.generateVideoVo(_uuid)
    VoUtils.addManifestToVideoVo(manifest, _vo)
    VoUtils.incrementRefIndex(_vo, 100)

    let _mediaSourceVo = VoUtils.generateMediaSourceVo(_vo)

    return _socket.getIndexBuffer(
      _vo.uuid,
      _mediaSourceVo.url,
      _mediaSourceVo.indexRange
    ).then(buffer => {
      _mediaSourceVo.indexBuffer = buffer
      return _socket.getRangeBuffer(
        _vo.uuid,
        _mediaSourceVo.url,
        _mediaSourceVo.byteRange, {
          youtubeDl: true,
          uuid: _vo.uuid,
          duration: _mediaSourceVo.duration
        }
      ).then(buffer => {
      	_mediaSourceVo.rangeBuffer = buffer
      	console.log(_mediaSourceVo);
      })
    })
  })
