
/**
 * 
 * @param {Request} request
 * @returns 
 */
function websocket(request) {
    const upgrade = request.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
        return new Response("Non-websocket upgrades not supported", {
            status: 403
        });
    }
    const { socket, response } = Deno.upgradeWebSocket(request);
    socket.onopen = () => console.log("socket opened");
    socket.onmessage = (event) => {
      console.log("socket message:", event.data);
      socket.send(new Date().toString());
    };
    socket.onerror = (event) => console.log("socket errored:", event);
    socket.onclose = () => console.log("socket closed");
    return response;
  }

/**
 * 
 * @param {Deno.Conn} conn 
 */
async function handle(conn) {
    try {
        const httpConn = Deno.serveHttp(conn);
        for await (const requestEvent of httpConn) {
            try {
                await requestEvent.respondWith(websocket(requestEvent.request));
            } catch {
                await requestEvent.respondWith(new Response("", {
                    status: 500,
                }));
            }
        }
    } catch {
        undefined;
    }
}

if (import.meta.main) {
    try {
        const server = Deno.listen({ transport: "tcp", port: 3737 });
        for await (const conn of server) {
            try { 
                handle(conn);
            } catch {
                undefined;
            }
        }
    } catch (error) {
        console.error(error);
    }
}