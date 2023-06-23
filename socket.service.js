const socketIO = require("socket.io");
let ioInstance;

class SocketService {
    constructor() {
        if (!ioInstance) {
            ioInstance = this;
        }
        return ioInstance;
    }

    listen(server) {
        this.io = socketIO(server, {
            cors: {
                origin: "*",
            },
        });

        this.io.on("connection", async (socket) => {


            socket.on("join", (processId) => {
                socket.join(processId.trim());

            });

            socket.on("unsubscribe", (data) => {
                socket.leaveAll();
            });
    });
        return this.io;
    }
}

module.exports = new SocketService();