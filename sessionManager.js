// sessionManager.js
/*
const fs = require('fs');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const removeFile = (FilePath) => {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
};

const createSession = async (id, number) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
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

        session.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect } = s;

            if (connection === 'open') {
                await delay(10000); // Wait for the session to stabilize

                session.sendMessage(session.user.id, { text: "This is from another page" });
            }
        });

        if (!session.authState.creds.registered) {
            await delay(1500);
            const code = await session.requestPairingCode(cleanNumber);
            return { session, code };
        }
        session.ev.on('creds.update', saveCreds);
        return { session };
    } catch (err) {
        console.log('service restarted');
        await removeFile('./temp/' + id);
        throw new Error('Service Unavailable');
    }
};

module.exports = { createSession };
*/
