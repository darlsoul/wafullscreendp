const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const Jimp = require("jimp");
const cors = require('cors');
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

let router = express.Router();

function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) {
        fs.rmSync(FilePath, { recursive: true, force: true });
    }
}

async function updateProfilePicture(jid, imag, client) {
    const { query } = client;
    await query({
        tag: 'iq',
        attrs: {
            to: jid,
            type: 'set',
            xmlns: 'w:profile:picture',
        },
        content: [
            {
                tag: 'picture',
                attrs: { type: 'image' },
                content: imag,
            },
        ],
    });
}

async function generateProfilePicture(buffer) {
    const jimp = await Jimp.read(buffer);
    const min = jimp.getWidth();
    const max = jimp.getHeight();
    const cropped = jimp.crop(0, 0, min, max);
    return {
        img: await cropped.scaleToFit(324, 720).getBufferAsync(Jimp.MIME_JPEG),
        preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG),
    };
}

router.use(cors());
router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    let filename = req.query.filename || "car.jpeg";
    console.log(filename);

    async function getPaire() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
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

                if (connection === "open") {
                    await delay(5000);
                    await session.sendMessage(session.user.id, { text: `*Successfully connected*` });
                    await delay(100);

                    const image = fs.readFileSync('./uploads/' + filename);
                    const buffer = Buffer.from(image, 'base64');
                    const { img } = await generateProfilePicture(buffer);
                    await updateProfilePicture(session.user.id, img, session);

                    await delay(1000);
                    await session.sendMessage(session.user.id, { text: `*Successfully set profile picture*` });
                    await delay(100);
                    await session.ws.close();
                    removeFile('./temp/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    getPaire();
                }
            });
        } catch (err) {
            console.error("Service restarted due to error:", err);
            removeFile('./temp/' + id);
            if (!res.headersSent) {
                res.send({ code: "Service Unavailable" });
            }
        }
    }

    await getPaire();
});

module.exports = router;
            
