var CallbackQueue = {
    Data: {},
    Enqueue: function (queueName, callback,args) {
        if (undefined === CallbackQueue.Data[queueName]) {
            CallbackQueue.Data[queueName] = [];
        }
        CallbackQueue.Data[queueName].push({ Func: callback, Args: args });
    },

    Execute: function (queueName) {
        var item = CallbackQueue.Data[queueName].pop();
        item.Func(item.Args);
    },

    GetQueueLength: function (queueName) {
        return CallbackQueue.Data[queueName].length;
    },

    GetQueue: function (queueName) {
        return CallbackQueue.Data[queueName];
    }
}