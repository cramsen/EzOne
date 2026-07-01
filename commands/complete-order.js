import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

const path = './vouches.json';
const PROOFS_CHANNEL_ID = '1465598921119371387'; // #proofs
const TRANSCRIPTS_CHANNEL_ID = '1465599081442447392'; // #transcripts
const VOUCH_CHANNEL_ID = '1465598901384908953'; // #vouches

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

        // 1. Update the Database and Calculate the ID
        let vouches = {};
        if (fs.existsSync(path)) vouches = JSON.parse(fs.readFileSync(path, 'utf8'));
        
        vouches[seller.id] = (vouches[seller.id] || 0) + 1;
        
        let grandTotal = 0;
        for (const key in vouches) {
            grandTotal += vouches[key];
        }
        
        fs.writeFileSync(path, JSON.stringify(vouches, null, 4));

        // 2. Automatically Create and Send the Vouch Embed
        const vouchChannel = interaction.guild.channels.cache.get(VOUCH_CHANNEL_ID);
        if (vouchChannel) {
            const vouchEmbed = new EmbedBuilder()
                .setColor(0x00FF00) 
                .setTitle(`⭐ New Vouch! (#${grandTotal})`) 
                .setDescription(`+ 1 vouch from ${buyer}`)
                .addFields(
                    { name: 'Seller', value: `${seller}`, inline: true },
                    { name: 'Total Vouches', value: `${vouches[seller.id]}`, inline: true },
                    { name: 'Game', value: `${game}`, inline: true },
                    { name: 'Item/Service', value: `${itemOrService}`, inline: true }
                )
                .setFooter({ text: `Eclipse Zone Vouch ID: ${grandTotal}` })
                .setTimestamp();
            
            await vouchChannel.send({ embeds: [vouchEmbed] });
            
            // Try to update the channel name
            vouchChannel.setName(`⭐・vouches：${grandTotal}`).catch(() => {
                console.log("Channel name rate limit hit.");
            });
        }

        // 3. Send Proofs to Logs (Tied to the New Vouch ID!)
        const proofsChannel = interaction.guild.channels.cache.get(PROOFS_CHANNEL_ID);
        if (proofsChannel) {
            const receiptEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`💰 Payment Receipt (Vouch #${grandTotal})`) 
                .setDescription(`**Seller:** ${seller}\n**Buyer:** ${buyer}\n**Item/Service:** ${itemOrService}\n**Game:** ${game}`)
                .setImage(paymentReceipt.url)
                .setFooter({ text: `Linked to Vouch ID: ${grandTotal}` })
                .setTimestamp();
                
            const tradeEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`🤝 Trade Proof (Vouch #${grandTotal})`) 
                .setDescription(`Delivery confirmation for ${itemOrService}`)
                .setImage(tradeProof.url)
                .setFooter({ text: `Linked to Vouch ID: ${grandTotal}` })
                .setTimestamp();
                
            await proofsChannel.send({ embeds: [receiptEmbed, tradeEmbed] });
        }

        // 4. Archive/Rename/Lock Channel
        const newName = interaction.channel.name.replace('purchase-', 'closed-');
        await interaction.channel.edit({
            name: newName,
            parent: '1521455074243510292',
            permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }]
        });

        // 5. Send Order Complete Log to Transcripts Channel
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
                .setFooter({ text: `Generated Vouch ID: ${grandTotal}` })
                .setTimestamp();
                
            await transcriptsChannel.send({ embeds: [completeEmbed] });
        }

        await interaction.editReply(`✅ Order #${grandTotal} finalized! Vouch posted, proofs linked, transcript logged, and ticket archived!`);
    },
};