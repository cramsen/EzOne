import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../firebase.js';

export default {
    data: new SlashCommandBuilder()
        .setName('vouches')
        .setDescription('Check how many vouches a seller has')
        .addUserOption(option => 
            option.setName('seller')
                .setDescription('The user to check vouches for')
                .setRequired(true)),
                
    async execute(interaction) {
        // Defer reply so the bot has time to fetch from the database
        await interaction.deferReply();
        
        const seller = interaction.options.getUser('seller');

        try {
            // 1. Look up the seller's total in Firebase
            const sellerRef = db.ref(`vouches/${seller.id}`);
            const snapshot = await sellerRef.once('value');
            const totalVouches = snapshot.val() || 0;

            // 2. Build and send the stats embed
            const statsEmbed = new EmbedBuilder()
                .setColor(0x0099FF) 
                .setTitle('📊 Seller Reputation')
                .setThumbnail(seller.displayAvatarURL({ dynamic: true })) 
                .addFields(
                    { name: 'Seller', value: `${seller}`, inline: true },
                    { name: 'Total Vouches', value: `${totalVouches}`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [statsEmbed] });
        } catch (error) {
            console.error("Firebase Read Error:", error);
            await interaction.editReply({ content: "❌ Error connecting to the database." });
        }
    },
};