import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete a specified number of messages.')
        // 👇 Locks the command to Admins only and hides it from regular users
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('The number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)   // Replaces your manual < 1 check
                .setMaxValue(100) // Replaces your manual > 100 check
        ),
                
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        try {
            // Delete the messages
            const deletedMessages = await interaction.channel.bulkDelete(amount, true);
            
            // Send a silent success message only you can see
            await interaction.reply({ 
                content: `Successfully deleted ${deletedMessages.size} messages! 🧹`,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error(error);
            // Send a silent fail message only you can see
            await interaction.reply({ 
                content: 'There was an error trying to purge messages! (Discord cannot bulk-delete messages older than 14 days)', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
};