import { PermissionFlagsBits } from 'discord.js';

export default {
    data: {
        name: 'purge',
        description: 'Bulk delete a specified number of messages.',
        options: [
            {
                name: 'amount',
                description: 'The number of messages to delete (1-100)',
                type: 4, // 4 means INTEGER type
                required: true,
            }
        ],
        // Restrict this command so only members with "Manage Messages" permissions can use it
        default_member_permissions: PermissionFlagsBits.ManageMessages.toString()
    },
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        // Check if the number is within Discord's allowed limits
        if (amount < 1 || amount > 100) {
            const reply = await interaction.reply({ content: 'You can only delete between 1 and 100 messages at a time!', fetchReply: true });
            setTimeout(() => reply.delete().catch(console.error), 5000);
            return;
        }

        try {
            // Delete the messages
            const deletedMessages = await interaction.channel.bulkDelete(amount, true);
            
            // Send a success message telling you how many were actually removed
            await interaction.reply(`Successfully deleted ${deletedMessages.size} messages! 🧹`);

            // Delete the bot's success message after 4 seconds
            setTimeout(() => {
                interaction.deleteReply().catch(console.error);
            }, 4000);

        } catch (error) {
            console.error(error);
            const failReply = await interaction.reply({ content: 'There was an error trying to purge messages in this channel! (Messages might be older than 14 days)', fetchReply: true });
            setTimeout(() => failReply.delete().catch(console.error), 6000);
        }
    }
};