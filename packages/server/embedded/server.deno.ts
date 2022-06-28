
interface ServeOptions {
    port: number,
    handler: (request: Request) => Promise<Response>;
}
export async function serve({ port, handler }: ServeOptions) {
    const server = Deno.listen({ port });

    async function handleConn(conn: Deno.Conn) {
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