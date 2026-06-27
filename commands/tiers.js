import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tiers')
        .setDescription('View the store role tiers and spending thresholds (Admin Only)')
        // This locks it so only Administrators can even see the command in the menu
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
                
    async execute(interaction) {
        // 1. Build the informational embed
        const tiersEmbed = new EmbedBuilder()
            .setColor(0x9B59B6) // Purple color for an administrative/store vibe
            .setTitle('💎 Role Tiers & Spend Thresholds')
            .setDescription('Current spending thresholds for buyer roles:')
            .addFields(
                { name: 'Dark Matter', value: '$10+', inline: true },
                { name: 'Nebula', value: '$50+', inline: true },
                { name: 'Supernova', value: '$150+', inline: true },
                { name: 'Singularity', value: '$300+', inline: true },
                { name: '⚠️ Discount Policies', value: '• Discounts **do not** apply to bundle deals.\n• The absolute maximum stacking discount cap is **15%** (this includes the 5% bulk discount).', inline: false }
            )
            .setTimestamp();

        // 2. Send the reply with the ephemeral flag
        await interaction.reply({ 
            embeds: [tiersEmbed], 
            ephemeral: true // This creates the "Only you can see this" dismissable message
        });
    },
};