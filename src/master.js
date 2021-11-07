const {Server, ServerType} = require('./server');
const ACCESS_TIMEOUT = 3000;
class Master extends Server{
    constructor(port) {
        super(ServerType.stWebsocket, port);
        this.on('access', this, 'onAccess');
    }
    onMessage(client, msg){
        console.log(msg.toString());
    }
    onAccess(client){
        this.log('info', `A client ${client.ip} has access to master.`);
        const self = this;
        setTimeout(()=>{
            const index = self.clients.indexOf(client);
            if(index > -1) self.clients.splice(index, 1);
            this.log('info', `The client ${client.ip} has been close cause no login.`);
            client.destroy();
        }, ACCESS_TIMEOUT);
    }
}

module.exports = {
    Master
};