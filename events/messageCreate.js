import { Events } from 'discord.js';

// Your #airlock channel ID
const AIRLOCK_CHANNEL_ID = '1465598724494589972';

export default {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        // 1. Check if the message came from a bot
        if (!message.author.bot) return;

        // 2. Check if the message is inside the #airlock channel
        if (message.channel.id !== AIRLOCK_CHANNEL_ID) return;

        // 3. Check if the bot that sent it is exactly named "OneBump"
        if (message.author.username === 'OneBump') {
            console.log(`[SORAI] Intruders spotted in the dojo. Purging unwanted scroll in 10 seconds... 🧹`);

            // 4. Wait 10 seconds, then delete it
            setTimeout(() => {
                message.delete()
                    .then(() => console.log('Successfully deleted OneBump advertisement from Airlock! 🧹'))
                    .catch(err => console.error('Failed to delete OneBump message:', err));
            }, 10000); 
        }
    },
};