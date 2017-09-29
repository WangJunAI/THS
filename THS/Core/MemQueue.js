var MemQueue = {
    Data: {},
    Enqueue: function (queueName, data) {
        if (undefined === MemQueue.Data[queueName]) {
            MemQueue.Data[queueName] = [];
        }
        MemQueue.Data[queueName].push(data);
    },
    GetQueueLength: function (queueName) {
        return MemQueue.Data[queueName].length;
    },
    
    GetQueue: function (queueName) {
        return MemQueue.Data[queueName];
    }
}

module.exports = MemQueue;