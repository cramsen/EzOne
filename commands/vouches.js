import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';

const path = './vouches.json';

export default {
    data: new SlashCommandBuilder()
        .setName('vouches')
        .setDescription('Check how many vouches a seller has')
        .addUserOption(option => 
            option.setName('seller')
                .setDescription('The user to check vouches for')
                .setRequired(true)),
                
    async execute(interaction) {
        const seller = interaction.options.getUser('seller');

        // 1. Read the current vouches from the JSON file
        let vouches = {};
        if (fs.existsSync(path)) {
            vouches = JSON.parse(fs.readFileSync(path, 'utf8'));
        }

        // 2. Look up the seller's total (if they aren't in the file, default to 0)
        const totalVouches = vouches[seller.id] || 0;

        // 3. Build and send the stats embed
        const statsEmbed = new EmbedBuilder()
            .setColor(0x0099FF) // Blue color for a neutral info check
            .setTitle('📊 Seller Reputation')
            .setThumbnail(seller.displayAvatarURL({ dynamic: true })) // Adds their profile picture
            .addFields(
                { name: 'Seller', value: `${seller}`, inline: true },
                { name: 'Total Vouches', value: `${totalVouches}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [statsEmbed] });
    },
};