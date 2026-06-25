export default {
    data: {
        name: 'ping',
        description: 'Check if the Eclipse Zone bot is online!',
    },
    async execute(interaction) {
        await interaction.reply('Pong! 🏓 Eclipse Zone MasterBot is online and fully operational.');
        setTimeout(() => {
            // Delete the reply and catch any errors (e.g., if the message was already deleted manually)
            interaction.deleteReply().catch(console.error);
        }, 5000); // 5000 milliseconds = 5 seconds
    }
};