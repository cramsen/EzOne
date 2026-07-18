import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('payment-received')
        .setDescription('Sends an embed confirming a customer payment.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const paymentEmbed = new EmbedBuilder()
            .setTitle('Tribute Verified 💸')
            .setDescription('Your tribute has been successfully verified by the Overseers. Please stand by for further instructions regarding the delivery of your assets.')
            .setColor('#EAEAEA') // Pale silver/white
            .setTimestamp() 
            .setFooter({ text: 'Sorai' }); 

        await interaction.reply({ embeds: [paymentEmbed] });
    },
};