const express = require('express');
const cors = require('cors');
const fs = require('fs');
const Jimp = require('jimp');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const router = express.Router();

router.use(cors());
router.use(express.json({ limit: '10mb' }));

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.post('/', async (req, res) => {
    const imgData = req.body.image;
    const number = req.body.number;
    if (!imgData || !number) {
        return res.status(400).send('No image data or phone number provided.');
    }

    let id = 'temp';
    const cleanNumber = number.replace(/[^0-9]/g, '');

    async function getPaire() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let session = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
                browser: Browsers.macOS('Safari'),
            });

            if (!session.authState.creds.registered) {
                await delay(1500);
                const code = await session.requestPairingCode(cleanNumber);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            session.ev.on('creds.update', saveCreds);

            session.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === 'open') {
                    await delay(10000); // Wait for the session to stabilize

                    try {
                        // Convert base64 string to buffer
                        const buffer = Buffer.from(imgData.split(',')[1], 'base64');
                        const { img } = await generateProfilePicture(buffer);
                        const jid = session.user.id;
                        await updateProfilePicture(jid, img, session);

                        await session.sendMessage(jid, { text: ' *_Successfully updated profile picture_*' });
                    } catch (error) {
                        console.error(error);
                        res.status(500).send('Error updating profile picture.');
                    }

                    await delay(100);
                    await session.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    getPaire();
                }
            });
        } catch (err) {
            console.log('service restarted');
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: 'Service Unavailable' });
            }
        }
    }

    return await getPaire();
});

async function updateProfilePicture(jid, imag, client) {
    const { query } = client;
    const { img } = await generateProfilePicture(imag);
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
                content: img,
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

module.exports = router;
                    
