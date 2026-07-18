import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tiers')
        .setDescription('View the dojo role tiers and spending thresholds (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
                
    async execute(interaction) {
        const tiersEmbed = new EmbedBuilder()
            .setColor('#BC1A22') // Sanemi Scar Red
            .setTitle('⛩️ Dojo Ranks & Thresholds')
            .setDescription('Current spending thresholds for disciple roles:')
            .addFields(
                { name: 'Mizunoto (Initiate)', value: '$10+', inline: true },
                { name: 'Kanoe (Striker)', value: '$50+', inline: true },
                { name: 'Kinoe (Wind Disciple)', value: '$150+', inline: true },
                { name: 'Tsuguko (Hashira Candidate)', value: '$300+', inline: true },
                { name: '⚠️ Discount Policies', value: '• Discounts **do not** apply to bundle deals.\n• The absolute maximum stacking discount cap is **15%** (this includes the 5% bulk discount).', inline: false }
            )
            .setTimestamp();

        await interaction.reply({ 
            embeds: [tiersEmbed], 
            ephemeral: true 
        });
    },
};