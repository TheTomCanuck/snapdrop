const http = require('http');
const WebSocket = require('ws');
const parser = require('ua-parser-js');
const { uniqueNamesGenerator, animals, colors } = require('unique-names-generator');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
		wss.handleUpgrade(req, socket, head, ws => {
				wss.emit('connection', ws, req);
				});
		});

class SnapdropServer {
	constructor(wss) {
		this._wss = wss;
		this._rooms = {};

		this._wss.on('connection', (socket, request) => this._onConnection(new Peer(socket, request)));
	}

	_onConnection(peer) {
		this._joinRoom(peer);
		peer.socket.on('message', msg => this._onMessage(peer, msg));
		peer.socket.on('error', console.error);
		this._keepAlive(peer);
	}

	_onMessage(sender, msg) {
		try { msg = JSON.parse(msg); } catch { return; }

		switch (msg.type) {
			case 'disconnect': this._leaveRoom(sender); break;
			case 'pong': sender.lastBeat = Date.now(); break;
		}

		if (msg.to && this._rooms[sender.ip]) {
			const recipient = this._rooms[sender.ip][msg.to];
			delete msg.to;
			msg.sender = sender.id;
			this._send(recipient, msg);
		}
	}
_joinRoom(peer) {
        if (!this._rooms[peer.ip]) this._rooms[peer.ip] = {};

        for (const id in this._rooms[peer.ip]) {
            this._send(this._rooms[peer.ip][id], {
                type: 'peer-joined',
                peer: peer.getInfo()
            });
        }

        const others = Object.values(this._rooms[peer.ip]).map(p => p.getInfo());
        this._send(peer, { type: 'peers', peers: others });

        this._rooms[peer.ip][peer.id] = peer;
    }
_leaveRoom(peer) {
	if (!this._rooms[peer.ip]?.[peer.id]) return;
	this._cancelKeepAlive(peer);
	delete this._rooms[peer.ip][peer.id];
	peer.socket.terminate();

	if (!Object.keys(this._rooms[peer.ip]).length) {
		delete this._rooms[peer.ip];
	} else {
		for (const id in this._rooms[peer.ip]) {
			this._send(this._rooms[peer.ip][id], {
type: 'peer-left',
peerId: peer.id
});
}
}
}

_send(peer, msg) {
	if (!peer || peer.socket.readyState !== WebSocket.OPEN) return;
	peer.socket.send(JSON.stringify(msg));
}

_keepAlive(peer) {
	this._cancelKeepAlive(peer);
	const timeout = 30000;
	if (!peer.lastBeat) peer.lastBeat = Date.now();
	if (Date.now() - peer.lastBeat > 2 * timeout) {
		this._leaveRoom(peer);
		return;
	}
	this._send(peer, { type: 'ping' });
	peer.timerId = setTimeout(() => this._keepAlive(peer), timeout);
}

_cancelKeepAlive(peer) {
	if (peer?.timerId) clearTimeout(peer.timerId);
}
}

class Peer {
	constructor(socket, request) {
		this.socket = socket;
		this._setIP(request);
		this._setPeerId();
		this._setName(request);
		this.timerId = 0;
		this.lastBeat = Date.now();
	}

	_setIP(req) {
		// Force everyone into same virtual room
		this.ip = '192.168.1.lan';
	}

	_setPeerId() {
		this.id = Peer.uuid();
	}

	_setName(req) {
		const ua = parser(req.headers['user-agent']);
		let deviceName = ua.os?.name?.replace('Mac OS', 'Mac') + ' ' || '';
		deviceName += ua.device.model || ua.browser.name || 'Unknown';

		this.name = {
model: ua.device.model,
       os: ua.os.name,
       browser: ua.browser.name,
       type: ua.device.type,
       deviceName,
       displayName: uniqueNamesGenerator({
length: 2,
separator: ' ',
dictionaries: [colors, animals],
style: 'capital',
seed: this.id.hashCode()
})
};
}

getInfo() {
	return { id: this.id, name: this.name, rtcSupported: true };
}

static uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
			});
}
}

Object.defineProperty(String.prototype, 'hashCode', {
value: function () {
let hash = 0;
for (let i = 0; i < this.length; i++) {
hash = ((hash << 5) - hash) + this.charCodeAt(i);
hash |= 0;
}
return hash;
}
});

new SnapdropServer(wss);
server.listen(3000, () => {
		console.log('Snapdrop backend ready (with names + icons)');
		});

