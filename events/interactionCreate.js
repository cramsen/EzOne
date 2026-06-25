import { Events } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        // If it's not a slash command, ignore it
        if (!interaction.isChatInputCommand()) return;

        // Grab the command from the bot's memory
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const replyObj = { content: 'There was an error executing this command!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyObj);
            } else {
                await interaction.reply(replyObj);
            }
        }
    },
};