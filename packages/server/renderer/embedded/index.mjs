import { 
    renderStream 
} from "../../../../build/packages/server/renderer/stream.js";

if (import.meta.main) {
    /** @type {[ReadableStream<Uint8Array>, number]} */
    const [readable, writeable] = await Promise.all([
        renderStream(), 
        Deno.core.opAsync("op_create_stream")
    ]);
    for await (const chunk of readable) {
        await Deno.core.write(writeable, chunk);
    }
    await Deno.core.write(writeable, new TextEncoder().encode("\n"));
}

