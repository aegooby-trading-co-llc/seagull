/**
 * 
 * @param {(controller: AbortController) => Promise<ReadableStream<Uint8Array>>} readerFn 
 */
export async function reader(readerFn) {
    try {
        const controller = new AbortController();
        /** @type {[ReadableStream<Uint8Array>, number]} */
        const [readable, writeable] = await Promise.all([
            readerFn(controller), 
            Deno.core.opAsync("op_create_stream")
        ]);
        for await (const chunk of readable) {
            /* No `await` here for some reason, or you get errors */
            Deno.core.write(writeable, chunk);
        }
        await readable.getReader().closed;
    } catch (error) {
        console.error(`Embedded JS error: ${error}`);
    }
}