function wrap(res, fn) {
    return function(...args) {
        if (res.timedout) {
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
            if (!res.headersSent) {
                res.statusCode = 503;
                res.type('txt');
                send.apply(res, ['Request Timeout']);
            }
        });
        res.on('error', error => {
           console.log(error);
        });
        res.send = wrap(res, send);
        res.sendStatus = wrap(res, sendStatus);
        res.status = wrap(res, status);
        next();
    };
}
