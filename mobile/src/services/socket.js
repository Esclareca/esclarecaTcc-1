import io from "socket.io-client";
import server from './server'

export default io(server);
