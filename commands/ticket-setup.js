import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Spawns the purchase ticket panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 
        
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Eclipse Zone | Purchase Ticket Instructions')
            .setDescription('Welcome to Eclipse Zone! To expedite your order and ensure a secure transaction, please follow the steps below:\n\n1. Provide Your Order Details\nPlease send the following information in this ticket immediately:\n• Game Name: (e.g., Grand Piece Online, Anime Vanguards, etc.)\n• Item(s) Desired: (List the specific units, items, or currency)\n• Quantity:\n• In-Game Username:\n• Select Your Payment Method State which method you will be using to pay\n Choose from: #💸・payment-methods')
            .setColor('#7FFF00') // Wind Breathing Green
            .setFooter({ text: 'Sorai' }); // Customized for your bot!

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('make a purchase!')
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Success); // Green button

        const row = new ActionRowBuilder().addComponents(button);

        // Send the panel and acknowledge the interaction
        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Purchase panel set up successfully!', ephemeral: true });
    },
};