import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

const path = './vouches.json';
const channelId = '1465598901384908953'; // Your vouch channel ID

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
        const seller = interaction.options.getUser('seller');
        const amount = interaction.options.getInteger('amount');

        // 1. Read current vouches
        let vouches = {};
        if (fs.existsSync(path)) {
            vouches = JSON.parse(fs.readFileSync(path, 'utf8'));
        }

        if (!vouches[seller.id] || vouches[seller.id] <= 0) {
            return interaction.reply({ 
                content: `⚠️ ${seller} doesn't have any vouches to remove!`, 
                ephemeral: true 
            });
        }

        // 2. Subtract and save
        vouches[seller.id] -= amount;
        if (vouches[seller.id] < 0) {
            vouches[seller.id] = 0;
        }
        fs.writeFileSync(path, JSON.stringify(vouches, null, 4));

        // 3. Send embed
        const removeEmbed = new EmbedBuilder()
            .setColor(0xFF0000) 
            .setTitle('➖ Vouches Removed')
            .setDescription(`Removed ${amount} vouch(es) from ${seller}.`)
            .addFields(
                { name: 'Seller', value: `${seller}`, inline: true },
                { name: 'New Total Vouches', value: `${vouches[seller.id]}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [removeEmbed] });

        // 4. Calculate Server Total and Update Channel Name
        let grandTotal = 0;
        for (const key in vouches) {
            grandTotal += vouches[key];
        }

        const vouchChannel = interaction.client.channels.cache.get(channelId);
        if (vouchChannel) {
            try {
                await vouchChannel.setName(`⭐・vouches：${grandTotal}`);
            } catch (error) {
                console.error("Rate limit hit: Could not update channel name this time.");
            }
        }
    },
};