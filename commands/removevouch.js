import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../firebase.js';

const channelId = '1465598901384908953'; 

export default {
    data: new SlashCommandBuilder()
        .setName('removevouch')
        .setDescription('Remove vouches from a seller (Admin Only)')
        .addUserOption(option => 
            option.setName('seller')
                .setDescription('The user to remove vouches from')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('How many vouches to remove')
                .setRequired(true)
                .setMinValue(1)) 
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
                
    async execute(interaction) {
        await interaction.deferReply();

        const seller = interaction.options.getUser('seller');
        const amount = interaction.options.getInteger('amount');
        const sellerRef = db.ref(`vouches/${seller.id}`);

        try {
            const sellerSnapshot = await sellerRef.transaction((currentValue) => {
                if (!currentValue || currentValue <= 0) return 0;
                const adjusted = currentValue - amount;
                return adjusted < 0 ? 0 : adjusted;
            });

            const newTotal = sellerSnapshot.snapshot.val();

            const removeEmbed = new EmbedBuilder()
                .setColor(0xFF0000) 
                .setTitle('➖ Vouches Removed')
                .setDescription(`Removed ${amount} vouch(es) from ${seller}.`)
                .addFields(
                    { name: 'Seller', value: `${seller}`, inline: true },
                    { name: 'New Total Vouches', value: `${newTotal}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [removeEmbed] });

            const vouchChannel = interaction.client.channels.cache.get(channelId);
            if (vouchChannel) {
                try {
                    await vouchChannel.setName(`⭐・vouches：${newTotal}`);
                } catch (error) {
                    console.error("Rate limit hit: Could not update channel name this time.");
                }
            }

        } catch (error) {
            console.error("Firebase Transaction Error:", error);
            await interaction.editReply({ content: "❌ Database error while removing vouches." });
        }
    },
};