const log = require('rfr')('lib/logging')(__filename);

function wrap(res, fn) {
    return function(...args) {
        if (res.timedout) {
            log.info({res: args, fjodor: args}, fn.name);
            return res;
        } else {
            return fn.apply(res, args);
        }
    };
}

export default (timeoutValue) => {
    return (req, res, next) => {
        const {send, sendStatus, status} = res;
        res.setTimeout(timeoutValue);
        res.on('timeout', () => {
            res.timedout = true;
            if (true || !res.headersSent) {
                log.info({req}, 'Request Timeout');
                res.statusCode = 408;
                res.type('txt');
                send.apply(res, ['Request Timeout']);
            }
        });
        res.send = wrap(res, send);
        res.sendStatus = wrap(res, sendStatus);
        res.status = wrap(res, status);
        next();
    };
}