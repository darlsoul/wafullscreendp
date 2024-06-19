const session = require('./router');
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
