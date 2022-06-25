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
        const reader = readable.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            } else if (value) {
                await Deno.core.write(writeable, value);
            }
        }
        await reader.closed;
    } catch (error) {
        console.error(`Embedded JS error: ${error}`);
    }
}