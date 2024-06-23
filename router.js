const express = require('express');
const fs = require('fs').promises; // Use fs.promises for async operations
const cors = require('cors');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const router = express.Router();
router.use(cors());

router.get('/', async (req, res) => {
    const id = req.query.id;
    let num = req.query.number;
    if(!id || !number) {
        res.status(404).send({error:"No id or phone number provided"});
    }

    async function getPaire() {
        const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);
        try {
            let session = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!session.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await session.requestPairingCode(num);
                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            session.ev.on('creds.update', saveCreds);

            session.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(5000); // Example delay, adjust as needed
                    await delay(5000); // Example delay, adjust as needed

                    const jsonData = await fs.readFile(`${__dirname}/temp/${id}/creds.json`, 'utf-8');

                    await session.sendMessage(session.user.id, { text: ` *Successfully Connected*\n\n *Total Scan :* 1` });
                    await session.sendMessage(session.user.id, { text: "Done" });

                    await delay(100); // Example delay, adjust as needed
                    await session.ws.close();
                    await removeFile(`./temp/${id}`); // Ensure file removal after usage
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000); // Example delay, adjust as needed
                    await getPaire(); // Recursive call, handle reconnection attempts
                }
            });
        } catch (err) {
            console.error("Error occurred:", err);
            await removeFile(`./temp/${id}`);
            if (!res.headersSent) {
                res.status(500).send({ error: "Service Unavailable" });
            }
        }
    }

    await getPaire(); // Ensure the function is awaited

    async function removeFile(FilePath) {
        try {
            if (await fs.access(FilePath)) {
                await fs.rm(FilePath, { recursive: true, force: true });
                console.log(`File ${FilePath} removed successfully`);
            }
        } catch (err) {
            console.error(`Error removing file ${FilePath}:`, err);
        }
    }
});

module.exports = router;
