import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

const path = './vouches.json';
const channelId = '1465598901384908953'; // Your vouch/log channel ID from vouch.js

export default {
    data: new SlashCommandBuilder()
        .setName('resyncvouch')
        .setDescription('Wipes a test vouch from the database and replaces the old visual embed.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Locks command to Admin Only
        .addUserOption(option => 
            option.setName('seller')
                .setDescription('The user whose vouch count needs to be rolled back')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('buyer')
                .setDescription('The original buyer who left the actual vouch')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('game')
                .setDescription('What game is this for? (e.g., bridgerl)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('item_or_service')
                .setDescription('What did they buy? (e.g., tusk)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message_id')
                .setDescription('The Message ID of the incorrect vouch embed to delete')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const seller = interaction.options.getUser('seller');
        const buyer = interaction.options.getUser('buyer');
        const game = interaction.options.getString('game');
        const itemOrService = interaction.options.getString('item_or_service');
        const messageId = interaction.options.getString('message_id');

        // 1. Read the current vouches from your JSON database file
        let vouches = {};
        if (fs.existsSync(path)) {
            vouches = JSON.parse(fs.readFileSync(path, 'utf8'));
        }

        // 2. Get the exact count from the database without changing it
        let sellerCount = vouches[seller.id] || 0;

        // 3. Recalculate the overall server Grand Total (how your bot assigns Vouch IDs)
        let grandTotal = 0;
        for (const key in vouches) {
            grandTotal += vouches[key];
        }

        try {
            // 4. Fetch and delete the broken message from the channel history
            const oldMessage = await interaction.channel.messages.fetch(messageId);
            await oldMessage.delete();

            // 5. Re-generate a brand new embed using the corrected counts
            const correctedEmbed = new EmbedBuilder()
                .setColor(0x00FF00) // Vibrant green border layout
                .setTitle(`⭐ New Vouch! (#${grandTotal})`) // Matches the global ID pattern
                .setDescription(`+ 1 vouch from ${buyer}`)
                .addFields(
                    { name: 'Seller', value: `${seller}`, inline: true },
                    { name: 'Total Vouches', value: `${sellerCount}`, inline: true },
                    { name: 'Game', value: `${game}`, inline: true },
                    { name: 'Item/Service', value: `${itemOrService}`, inline: true }
                )
                .setFooter({ text: `Eclipse Zone Vouch ID: ${grandTotal}` })
                .setTimestamp();

            // 6. Send the corrected embed cleanly back into the same channel
            await interaction.channel.send({ embeds: [correctedEmbed] });

            // 7. Update the server total vouches channel name counter
            const vouchChannel = interaction.client.channels.cache.get(channelId);
            if (vouchChannel) {
                try {
                    await vouchChannel.setName(`⭐・vouches：${grandTotal}`);
                } catch (error) {
                    console.error("Rate limit hit: Could not update channel name this time.");
                }
            }

            // 8. Confirm success to the administrator who ran the command
            await interaction.editReply({ 
                content: `✅ Successfully cleared the test drift!\n• Database corrected for ${seller.username}\n• Erroneous embed deleted\n• Replacement embed synchronized to global vouch **#${grandTotal}**!` 
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ 
                content: '❌ Failed to complete resync. Make sure the `message_id` you provided is valid and exists in this specific channel.' 
            });
        }
    },
};