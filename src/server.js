const WebSocketServer = require('ws').WebSocketServer;
const Telnet = require('telnetlib');
const Base = require('./base');
const ServerType = {
    stWebsocket: 1,
    stTelnet: 2
}
class Client extends Base{
    constructor(client, ip) {
        super();
        this.client = client;
        this.ip = ip;
        this.lasttime = this.now();
    }
    onMessage(msg){
        this.lasttime = this.now();
        this._callEvent('message', [this, msg]);
    }
    send(data){
        try {
            this._send(data);
            this.lasttime = this.now();
        }catch (e) {
            this.destroy();
        }
    }
    destroy(){
        this._callEvent('close', [this]);
        this.events = {};
        this.client = null;
    }
    _send(data){}
}
class WSClient extends Client{
    constructor(client, ip) {
        super(client, ip);
        const self = this;
        this.client.on('message', (msg)=>{self.onMessage(msg)});
        this.client.on('pong',()=>{self.lasttime = self.now()});
        this.pingHandler = setInterval(()=>{
            const now = self.now();
            if(now - self.lasttime > 5000){
                self.destroy();
                return;
            }
            if(now - self.lasttime > 1000){
                self.client.ping();
            }
        }, 1000);
    }
    destroy() {
        clearInterval(this.pingHandler);
        try{
            this.client.close();
        }catch (e){}
        super.destroy();
    }

    _send(data){this.client.send(data)}
}
class TlnClient extends Client{
    constructor(client, ip) {
        super(client, ip);
        const self = this;
        this.client.on('data', (msg)=>{self.onMessage(msg)});
        this.client.on('close', ()=>{self.destroy()});
    }
    destroy() {
        try{
            this.client.end();
        }catch (e) {}
        super.destroy();
    }

    _send(data){this.client.write(data)}
}
class Server extends Base{
    /**
     *
     * @param serverType
     * @param port
     */
    constructor(serverType, port) {
        super();
        if(!port) throw 'option must be set.';
        this.server = null;
        this.clients = [];

        const self = this;
        if(serverType === ServerType.stWebsocket){
            this.server = new WebSocketServer({port:port});
            this.server.on('connection',(ws, req)=>{
                const ip = req.headers['x-forwarded-for']?req.headers['x-forwarded-for'].split(',')[0].trim():req.socket.remoteAddress;
                const client = new WSClient(ws, ip);
                client.on('message', self, 'onMessage');
                self.clients.push(client);
                self._callEvent('access', [client]);
            });
        }else if(serverType === ServerType.stTelnet){
            this.server = Telnet.createServer({}, (c) => {
                c.on('negotiated', (d) => {
                    const ip = '127.0.0.1';
                    const client = new TlnClient(c, ip);
                    client.on('message', self, 'onMessage');
                    self.clients.push(client);
                    self._callEvent('access', [client]);
                });
            }).listen(port);
        }else{
            throw 'No specific server type to start.';
        }
        this.log('',`The server listening on ${port} for ${serverType === ServerType.stWebsocket?'WebSocket':'Telnets.'}`);
    }

}
module.exports = {
    Server,
    Client,
    ServerType
}