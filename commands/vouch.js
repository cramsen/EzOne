import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';

const path = './vouches.json';
const channelId = '1465598901384908953'; // Your vouch/log channel ID

export default {
    data: new SlashCommandBuilder()
        .setName('vouch')
        .setDescription('Leave a vouch for a seller')
        .addUserOption(option => 
            option.setName('seller')
                .setDescription('The user you are vouching for')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('game')
                .setDescription('What game is this for?')
                .setRequired(true))
        // Changed from 'item' to 'item_or_service' so it shows up in the command menu
        .addStringOption(option => 
            option.setName('item_or_service')
                .setDescription('What did you buy?')
                .setRequired(true)),
                
    async execute(interaction) {
        const seller = interaction.options.getUser('seller');
        const game = interaction.options.getString('game'); 
        // Make sure to grab the new name here too
        const itemOrService = interaction.options.getString('item_or_service');
        const buyer = interaction.user;

        // 1. Read the current vouches
        let vouches = {};
        if (fs.existsSync(path)) {
            vouches = JSON.parse(fs.readFileSync(path, 'utf8'));
        }

        // 2. Add the new vouch
        if (!vouches[seller.id]) {
            vouches[seller.id] = 0;
        }
        vouches[seller.id] += 1;

        // 3. Calculate Server Total FIRST so we can use it as the Vouch Number
        let grandTotal = 0;
        for (const key in vouches) {
            grandTotal += vouches[key];
        }

        // 4. Save to file
        fs.writeFileSync(path, JSON.stringify(vouches, null, 4));

        // 5. Build the embed and add the Grand Total as the Vouch Number
        const vouchEmbed = new EmbedBuilder()
            .setColor(0x00FF00) 
            .setTitle(`⭐ New Vouch! (#${grandTotal})`) 
            .setDescription(`+ 1 vouch from ${buyer}`)
            .addFields(
                { name: 'Seller', value: `${seller}`, inline: true },
                { name: 'Total Vouches', value: `${vouches[seller.id]}`, inline: true },
                { name: 'Game', value: `${game}`, inline: true },
                // Cleanly formatted for the embed display
                { name: 'Item/Service', value: `${itemOrService}`, inline: true }
            )
            .setFooter({ text: `Eclipse Zone Vouch ID: ${grandTotal}` })
            .setTimestamp();

        // 6. Find the vouch channel and send the embed there
        const vouchChannel = interaction.client.channels.cache.get(channelId);
        
        if (vouchChannel) {
            await vouchChannel.send({ embeds: [vouchEmbed] });
            
            await interaction.reply({ 
                content: `✅ Successfully vouched for ${seller}! Your vouch was logged in ${vouchChannel}.`, 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: `⚠️ Vouch counted, but I couldn't find the vouch channel to log the embed!`, 
                ephemeral: true 
            });
        }

        // 7. Update Channel Name (10-minute rate limit applies)
        if (vouchChannel) {
            try {
                await vouchChannel.setName(`⭐・vouches：${grandTotal}`);
            } catch (error) {
                console.error("Rate limit hit: Could not update channel name this time.");
            }
        }
    },
};