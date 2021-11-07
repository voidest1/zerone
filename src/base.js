module.exports = class Base{
    constructor() {
        this.createTime = this.now();
        this.events = {};
    }
    on(event, target, func){
        this.events[event] = {target:target, func:func}
    }
    _callEvent(ev, param){
        const event = this.events[ev];
        if(event && typeof event.target[event.func] === 'function'){
            try {
                event.target[event.func].apply(event.target, param);
            }catch (e) {
                console.warn('Event:'+ev+'\n'+e.stack);
            }
        }
    }
    now(second){
        const n = new Date().getTime();
        return second?Math.floor(n/1000):n;
    }

    /**
     * @param level - info|warn|error, cli include -d disable info output
     */
    log(level){
        level = level.toLowerCase();
        if(process.argv.indexOf('-d') > -1 && ['info'].indexOf(level) > -1) return;
        let args = Array.prototype.slice.call(arguments);
        args = args.slice(1);
        let msg = '';
        for(let i in args){
            if(typeof args[i] === 'object'){
                msg += JSON.stringify(args[i]);
            }else{
                msg += args[i];
            }
        }

        let pilot = new Date().Format('[yyyy-MM-dd hh:mm:ss.S]');
        switch(level){
            case 'info':
                pilot = '[32m'+pilot+'.INFO.[0m'+process.pid+': ';
                console.info(pilot+msg);
                break;
            case 'warn':
                pilot = '[33m'+pilot+'.WARN.[0m'+process.pid+': ';
                console.warn(pilot+msg);
                break;
            case 'error':
                pilot = '[91m'+pilot+'.ERROR.[0m'+process.pid+': ';
                console.error(pilot+msg);
                break;
            default:
                console.log(pilot+msg);
                break;
        }
    }
}
Date.prototype.Format = function (fmt) { //author: meizz
    let ms = '00'+this.getMilliseconds();
    ms = ms.substr(ms.length-3);
    let o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S":  ms//毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}