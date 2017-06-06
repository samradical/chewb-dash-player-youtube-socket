Used within [Chewb Dash Player](https://github.com/samradical/chewb-dash-player).

Get youtube dash chunks ready to be added to a video with Media Source Extensions

Uses a websocket client to request youtube buffer chunks from [Chewb](https://github.com/samradical/chewb) which is the socket server you connect to.

## Use

Connect to a **Chewb** with `socket.io-client`

const socket = new YoutubeSocket(socketClient)

> promised with bluebird

### dash

Get sidx - this describes the ranges to request

```
socket
.getSidx({itags:["136"]}, options, { id: vId }))
.then(sidx => {
})
```

Get range

```
socket.getVideoRange({
        uuid: uuid, //optional, for caching
        url: url, //from the 'sidx'
        range: range //from the 'sidx'
      })
```



### youtube

Interface with youtube api.

```
socket.youtube.playlistItems({
        playlistId,
        force: true, //get new uncached items
        access_token: accessToken //optional, but the envvars will need to be setup in Chewb if false
      })
      .then(results => {

      })
      
```

```      
	socket.youtube.search({
        q,
        access_token: accessToken
      })
      .then(results => {
      })
```


```
socket.youtube.video({
      id,
      access_token: accessToken
    })
```

