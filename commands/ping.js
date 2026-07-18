export default {
    data: {
        name: 'ping',
        description: 'Check if Sorai is online!',
    },
    async execute(interaction) {
        await interaction.reply('Caw! 🦅 Sorai is awake and guarding the dojo gates.');
        setTimeout(() => {
            interaction.deleteReply().catch(console.error);
        }, 5000); 
    }
};