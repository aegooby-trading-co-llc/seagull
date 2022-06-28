/** 
 * @typedef ServeOptions
 * @property {number} port
 * @property {(request: Request) => Promise<Response>} handler
 */

/**
 * 
 * @param {ServeOptions} param0 
 */
 export async function serve({ port, handler }) {
    const server = Deno.listen({ port });

    async function handleConn(conn) {
        const httpConn = Deno.serveHttp(conn);
        try {
            for await (const requestEvent of httpConn) {
                let response = null;
                try {
                    response = await handler(requestEvent.request);
                } catch (error) {
                    response = new Response(JSON.stringify(error), { 
                        status: 500 
                    });
                }
                try { 
                    await requestEvent.respondWith(response); 
                } catch {
                    undefined;
                }
            }
        } catch {
            undefined;
        }
    }
    
    for await (const conn of server) {
        try { handleConn(conn); } catch { undefined; }
    }
}