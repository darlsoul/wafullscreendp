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

router.get('/', async (req, res) => {
    const number = req.body.number;
    if (!number) {
        return res.status(400).send('No phone number provided.');
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

module.exports = router;
                    
