import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../firebase.js';

const PROOFS_CHANNEL_ID = '1465598921119371387'; 
const TRANSCRIPTS_CHANNEL_ID = '1465599081442447392'; 
const VOUCH_CHANNEL_ID = '1465598901384908953'; 

export default {
    data: new SlashCommandBuilder()
        .setName('complete-order')
        .setDescription('Finalizes ticket, posts vouch, logs tied proofs, and archives.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('buyer').setDescription('The buyer').setRequired(true))
        .addStringOption(option => option.setName('item_or_service').setDescription('Item or service sold').setRequired(true))
        .addStringOption(option => option.setName('game').setDescription('Game name').setRequired(true))
        .addAttachmentOption(option => option.setName('payment_receipt').setDescription('Payment proof').setRequired(true))
        .addAttachmentOption(option => option.setName('trade_proof').setDescription('Trade proof').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const buyer = interaction.options.getUser('buyer');
        const seller = interaction.user;
        const itemOrService = interaction.options.getString('item_or_service');
        const game = interaction.options.getString('game');
        const paymentReceipt = interaction.options.getAttachment('payment_receipt');
        const tradeProof = interaction.options.getAttachment('trade_proof');

        // 1. Reference ONLY the seller's path in Firebase
        const sellerRef = db.ref(`vouches/${seller.id}`);

        try {
            // 2. Add 1 to the seller's count atomically
            const sellerSnapshot = await sellerRef.transaction((currentValue) => {
                return (currentValue || 0) + 1;
            });
            const newTotal = sellerSnapshot.snapshot.val();

            // 3. Automatically Create and Send the Vouch Embed
            const vouchChannel = interaction.guild.channels.cache.get(VOUCH_CHANNEL_ID);
            if (vouchChannel) {
                const vouchEmbed = new EmbedBuilder()
                    .setColor(0x00FF00) 
                    .setTitle(`⭐ New Vouch! (#${newTotal})`) 
                    .setDescription(`+ 1 vouch from ${buyer}`)
                    .addFields(
                        { name: 'Seller', value: `${seller}`, inline: true },
                        { name: 'Total Vouches', value: `${newTotal}`, inline: true },
                        { name: 'Game', value: `${game}`, inline: true },
                        { name: 'Item/Service', value: `${itemOrService}`, inline: true }
                    )
                    .setFooter({ text: `Eclipse Zone Vouch ID: ${newTotal}` })
                    .setTimestamp();
                
                await vouchChannel.send({ embeds: [vouchEmbed] });
                
                vouchChannel.setName(`⭐・vouches：${newTotal}`).catch(() => {
                    console.log("Channel name rate limit hit.");
                });
            }

            // 4. Send Proofs to Logs
            const proofsChannel = interaction.guild.channels.cache.get(PROOFS_CHANNEL_ID);
            if (proofsChannel) {
                const receiptEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(`💰 Payment Receipt (Vouch #${newTotal})`) 
                    .setDescription(`**Seller:** ${seller}\n**Buyer:** ${buyer}\n**Item/Service:** ${itemOrService}\n**Game:** ${game}`)
                    .setImage(paymentReceipt.url)
                    .setFooter({ text: `Linked to Vouch ID: ${newTotal}` })
                    .setTimestamp();
                    
                const tradeEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`🤝 Trade Proof (Vouch #${newTotal})`) 
                    .setDescription(`Delivery confirmation for ${itemOrService}`)
                    .setImage(tradeProof.url)
                    .setFooter({ text: `Linked to Vouch ID: ${newTotal}` })
                    .setTimestamp();
                    
                await proofsChannel.send({ embeds: [receiptEmbed, tradeEmbed] });
            }

            // 5. Archive/Rename/Lock Channel
            // Extract the client name by removing the 'purchase-' prefix
            const clientName = interaction.channel.name.replace('purchase-', '');
            // Format the new name to match: vouch number-clientName-closed
            const newName = `${newTotal}-${clientName}-closed`;

            await interaction.channel.edit({
                name: newName,
                parent: '1521455074243510292',
                permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }]
            });

            // 6. Send Order Complete Log
            const transcriptsChannel = interaction.guild.channels.cache.get(TRANSCRIPTS_CHANNEL_ID);
            if (transcriptsChannel) {
                const completeEmbed = new EmbedBuilder()
                    .setColor(0x9B59B6)
                    .setTitle('✅ Order Complete')
                    .setDescription(`Ticket ${interaction.channel} has been successfully closed and archived.`)
                    .addFields(
                        { name: 'Seller', value: `${seller}`, inline: true },
                        { name: 'Buyer', value: `${buyer}`, inline: true },
                        { name: 'Game', value: `${game}`, inline: true },
                        { name: 'Item/Service', value: `${itemOrService}`, inline: true }
                    )
                    .setFooter({ text: `Generated Vouch ID: ${newTotal}` })
                    .setTimestamp();
                
                await transcriptsChannel.send({ embeds: [completeEmbed] });
            }

            await interaction.editReply(`✅ Order #${newTotal} finalized! Vouch posted, proofs linked, transcript logged, and ticket archived!`);
        } catch (error) {
            console.error("Firebase Transaction Error:", error);
            await interaction.editReply({ content: "❌ Database error while finalizing the order." });
        }
    },
};