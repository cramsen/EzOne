// 🔴 PASTE YOUR COPIED STATUS CHANNEL ID BETWEEN THE QUOTES HERE:
const STATUS_CHANNEL_ID = '1465750095852081245';

export default {
    data: {
        name: 'setstatus',
        description: 'Update the market server status channel name',
        options: [
            {
                name: 'state',
                description: 'The new status of the market',
                type: 3, 
                required: true,
                choices: [
                    { name: 'Online', value: 'online' },
                    { name: 'Down', value: 'down' },
                    { name: 'Maintenance', value: 'maintenance' }
                ]
            }
        ]
    },
    async execute(interaction) {
        const chosenState = interaction.options.getString('state');
        const channel = await interaction.guild.channels.fetch(STATUS_CHANNEL_ID);
        
        if (!channel) {
            return await interaction.reply({ content: 'Could not find the status channel. Check your ID!', ephemeral: true });
        }

        let newName = '';
        let replyMessage = '';

        if (chosenState === 'online') {
            newName = 'STATUS: 🟢 ONLINE';
            replyMessage = 'The Dojo Gates are now **Open**! ⛩️';
            setTimeout(() => {
            // Delete the reply and catch any errors (e.g., if the message was already deleted manually)
            interaction.deleteReply().catch(console.error);
        }, 5000); // 5000 milliseconds = 5 seconds
        } else if (chosenState === 'down') {
            newName = 'STATUS: 🔴 DOWN';
            replyMessage = 'The Dojo Gates are currently **Sealed**! ⛩️';
            setTimeout(() => {
            // Delete the reply and catch any errors (e.g., if the message was already deleted manually)
            interaction.deleteReply().catch(console.error);
        }, 5000); // 5000 milliseconds = 5 seconds
        } else if (chosenState === 'maintenance') {
            newName = 'STATUS: 🟡 MAINTENANCE';
            replyMessage = 'The Dojo is undergoing **Maintenance**! ⛩️';
            setTimeout(() => {
            // Delete the reply and catch any errors (e.g., if the message was already deleted manually)
            interaction.deleteReply().catch(console.error);
        }, 5000); // 5000 milliseconds = 5 seconds
        }

        try {
            await channel.setName(newName);
            await interaction.reply({ content: replyMessage });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to update channel!', ephemeral: true });
        }
    }
};