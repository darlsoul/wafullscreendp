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
    let num = number;
    let sessionId = id; // Changed 'id' to 'sessionId' to avoid redeclaration
    async function getPaire() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + sessionId);
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
                return await { code };
            }

            session.ev.on('creds.update', saveCreds);

            session.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(5000);
                    await delay(5000);

                    const jsonData = await fs.promises.readFile(`${__dirname}/temp/${sessionId}/creds.json`, 'utf-8');
                    return await { jsonData };
                    
                    await session.sendMessage(session.user.id, { text: ` *Successfully Connected*` });
                    await session.sendMessage(session.user.id, { text: data.data });

                    await delay(100);
                    await session.ws.close();
                    return await removeFile('./temp/' + sessionId);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    getPaire();
                }
            });
        } catch (err) {
            console.log("service restated");
            await removeFile('./temp/' + sessionId);
            return { "Error : "+err }
        }
    }

    return await getPaire();
};

                    
