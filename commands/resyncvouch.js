import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../firebase.js';

const channelId = '1465598901384908953'; 
const PROOFS_CHANNEL_ID = '1465598921119371387'; 

export default {
    data: new SlashCommandBuilder()
        .setName('resyncvouch')
        .setDescription('Wipes a broken vouch embed and optionally re-syncs corrected proofs.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('payment_receipt')
                .setDescription('Upload to post a corrected payment proof')
                .setRequired(false))
        .addAttachmentOption(option => 
            option.setName('trade_proof')
                .setDescription('Upload to post a corrected trade proof')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const seller = interaction.options.getUser('seller');
        const buyer = interaction.options.getUser('buyer');
        const game = interaction.options.getString('game');
        const itemOrService = interaction.options.getString('item_or_service');
        const messageId = interaction.options.getString('message_id');
        const paymentReceipt = interaction.options.getAttachment('payment_receipt');
        const tradeProof = interaction.options.getAttachment('trade_proof');

        try {
            // 1. Fetch current seller count directly from Firebase
            const sellerRef = db.ref(`vouches/${seller.id}`);
            const snapshot = await sellerRef.once('value');
            const currentTotal = snapshot.val() || 0;

            // 2. Fetch and delete the broken message from the channel history
            const oldMessage = await interaction.channel.messages.fetch(messageId);
            if (oldMessage) await oldMessage.delete();

            // 3. Re-generate the brand new embed using the clean database count
            const correctedEmbed = new EmbedBuilder()
                .setColor(0x00FF00) 
                .setTitle(`⭐ New Vouch! (#${currentTotal})`) 
                .setDescription(`+ 1 vouch from ${buyer}`)
                .addFields(
                    { name: 'Seller', value: `${seller}`, inline: true },
                    { name: 'Total Vouches', value: `${currentTotal}`, inline: true },
                    { name: 'Game', value: `${game}`, inline: true },
                    { name: 'Item/Service', value: `${itemOrService}`, inline: true }
                )
                .setFooter({ text: `Eclipse Zone Vouch ID: ${currentTotal}` })
                .setTimestamp();

            // 4. Send the corrected embed cleanly back into the same channel
            await interaction.channel.send({ embeds: [correctedEmbed] });

            // 5. Update the server total vouches channel name counter
            const vouchChannel = interaction.client.channels.cache.get(channelId);
            if (vouchChannel) {
                try {
                    await vouchChannel.setName(`⭐・vouches：${currentTotal}`);
                } catch (error) {
                    console.error("Rate limit hit: Could not update channel name this time.");
                }
            }

            // 6. Handle Re-syncing Proofs if the user uploaded them
            let proofMessage = "";
            if (paymentReceipt || tradeProof) {
                const proofsChannel = interaction.client.channels.cache.get(PROOFS_CHANNEL_ID);
                if (proofsChannel) {
                    const proofEmbeds = [];

                    if (paymentReceipt) {
                        proofEmbeds.push(new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle(`💰 Payment Receipt (Vouch #${currentTotal})`)
                            .setDescription(`**Seller:** ${seller}\n**Buyer:** ${buyer}\n**Item:** ${itemOrService}\n**Game:** ${game}`)
                            .setImage(paymentReceipt.url)
                            .setFooter({ text: `Linked to Vouch ID: ${currentTotal}` })
                            .setTimestamp()
                        );
                    }

                    if (tradeProof) {
                        proofEmbeds.push(new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`🤝 Trade Proof (Vouch #${currentTotal})`)
                            .setDescription(`Delivery confirmation for ${itemOrService}`)
                            .setImage(tradeProof.url)
                            .setFooter({ text: `Linked to Vouch ID: ${currentTotal}` })
                            .setTimestamp()
                        );
                    }

                    await proofsChannel.send({ embeds: proofEmbeds });
                    proofMessage = "\n• Corrected proofs linked and sent to #proofs! *(Manually delete the old ones)*";
                }
            }

            // 7. Confirm success to the administrator who ran the command
            await interaction.editReply({ 
                content: `✅ Successfully cleared the drift!\n• Database matched for ${seller.username}\n• Erroneous embed deleted\n• Replacement embed synchronized to global vouch **#${currentTotal}**!${proofMessage}` 
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ 
                content: '❌ Failed to complete resync. Make sure the `message_id` you provided is valid and exists in this specific channel.' 
            });
        }
    },
};