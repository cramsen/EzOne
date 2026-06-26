import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('payment-received')
        .setDescription('Sends an embed confirming a customer payment.'),
        
    async execute(interaction) {
        // Build the embed message
        const paymentEmbed = new EmbedBuilder()
            .setTitle('Payment Received! 💸')
            .setDescription('Your payment has been successfully verified. Please stand by for further instructions regarding the delivery of your items.')
            .setColor('#fffdd0') // A nice success/verification green
            .setTimestamp() // Adds the exact time the payment was confirmed
            .setFooter({ text: 'Eclipse Zone Marketplace' }); // Optional footer

        // Reply to the slash command with the embed
        await interaction.reply({ embeds: [paymentEmbed] });
    },
};