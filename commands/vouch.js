import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../firebase.js';

const channelId = '1465598901384908953'; 
const myId = '433091337332457472'; 

export default {
    data: new SlashCommandBuilder()
        .setName('vouch')
        .setDescription('Leave a vouch for the Eclipse Zone owner')
        .addStringOption(option => 
            option.setName('game')
                .setDescription('What game is this for?')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('item_or_service')
                .setDescription('What did you buy?')
                .setRequired(true)),
                
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const game = interaction.options.getString('game'); 
        const itemOrService = interaction.options.getString('item_or_service');
        const buyer = interaction.user;

        // 1. Reference ONLY your personal path
        const sellerRef = db.ref(`vouches/${myId}`);

        try {
            // 2. Add 1 to your total
            const sellerSnapshot = await sellerRef.transaction((currentValue) => {
                return (currentValue || 0) + 1;
            });
            
            // This one number is now used for both your stats and the Vouch ID!
            const newTotal = sellerSnapshot.snapshot.val();

            // 3. Build the embed
            const vouchEmbed = new EmbedBuilder()
                .setColor(0x7FFF00) // Wind Breathing Green
                .setTitle(`⭐ New Vouch! (#${newTotal})`) 
                .setDescription(`+ 1 vouch from ${buyer}`)
                .addFields(
                    { name: 'Seller', value: `<@${myId}>`, inline: true },
                    { name: 'Total Vouches', value: `${newTotal}`, inline: true },
                    { name: 'Game', value: `${game}`, inline: true },
                    { name: 'Item/Service', value: `${itemOrService}`, inline: true }
                )
                .setFooter({ text: `Dojo Archive ID: ${newTotal}` })
                .setTimestamp();

            // 4. Send the embed
            const vouchChannel = interaction.client.channels.cache.get(channelId);
            
            if (vouchChannel) {
                await vouchChannel.send({ embeds: [vouchEmbed] });
                await interaction.editReply({ 
                    content: `✅ Successfully vouched for <@${myId}>! Your vouch was logged in ${vouchChannel}.`
                });

                try {
                    await vouchChannel.setName(`⭐・vouches：${newTotal}`);
                } catch (error) {
                    console.error("Rate limit hit: Could not update channel name this time.");
                }
            } else {
                await interaction.editReply({ 
                    content: `⚠️ Vouch counted in database, but couldn't find the vouch channel!`
                });
            }

        } catch (error) {
            console.error("Firebase Transaction Error:", error);
            await interaction.editReply({ content: "❌ Database error while saving your vouch." });
        }
    },
};