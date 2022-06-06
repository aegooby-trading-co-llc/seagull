import "dotenv/config";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import Cloudflare from "cloudflare";

const cf = new Cloudflare({ token: process.env.CLOUDFLARE_CRINGE_API_TOKEN });

const account_id = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespace_id = process.env.CLOUDFLARE_NAMESPACE_ID_PREVIEW;

const root = path.join(process.cwd(), "build", "snowpack");

const files = [];

async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const fullname = path.join(directory, entry.name);
        if (entry.isFile()) {
            const newValue = (await fs.readFile(fullname)).toString();
            const key = fullname.replace(root, "");
            try { 
                const currentValue = await cf.enterpriseZoneWorkersKV.read(
                    account_id,
                    namespace_id,
                    encodeURIComponent(key)
                ); 
                const currentHash = crypto
                    .createHash("md5")
                    .update(currentValue)
                    .digest("hex"); 
                const newHash = crypto
                    .createHash("md5")
                    .update(newValue)
                    .digest("hex"); 
                if (currentHash != newHash) { 
                    files.push({ key: key, value: newValue });
                }
            }
            catch {
                files.push({ key: key, value: newValue });
            }
            
        }
        if (entry.isDirectory()) {
            await walk(fullname);
        }
    }
}

if (account_id && namespace_id) {
    await walk(root);
    await cf.enterpriseZoneWorkersKV.addMulti(
        account_id,
        namespace_id,
        // eslint-disable-next-line
        // @ts-ignore
       files
    );
}
