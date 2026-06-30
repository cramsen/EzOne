import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import * as transcript from 'discord-html-transcripts';

const path = './vouches.json';

export default {
    data: new SlashCommandBuilder()
        .setName('complete-order')
        .setDescription('Finalizes the ticket, logs proofs, vouches, saves transcript, and archives.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('buyer').setDescription('The buyer').setRequired(true))
        .addStringOption(option => option.setName('item_or_service').setDescription('Item or service sold').setRequired(true)) // Updated name
        .addStringOption(option => option.setName('game').setDescription('Game name').setRequired(true))
        .addAttachmentOption(option => option.setName('payment_receipt').setDescription('Payment proof').setRequired(true))
        .addAttachmentOption(option => option.setName('trade_proof').setDescription('Trade proof').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const buyer = interaction.options.getUser('buyer');
        const seller = interaction.user;
        const itemOrService = interaction.options.getString('item_or_service'); // Updated retrieval
        const game = interaction.options.getString('game');
        const paymentReceipt = interaction.options.getAttachment('payment_receipt');
        const tradeProof = interaction.options.getAttachment('trade_proof');

        // 1. Log the Vouch[cite: 11]
        let vouches = {};
        if (fs.existsSync(path)) vouches = JSON.parse(fs.readFileSync(path, 'utf8'));
        vouches[seller.id] = (vouches[seller.id] || 0) + 1;
        fs.writeFileSync(path, JSON.stringify(vouches, null, 4));

        // 2. Generate and save Transcript
        const attachment = await transcript.createTranscript(interaction.channel);
        const transcriptChannel = interaction.guild.channels.cache.get('1465599081442447392');
        if (transcriptChannel) {
            await transcriptChannel.send({
                content: `Transcript for ${interaction.channel.name}:`,
                files: [attachment]
            });
        }

        // 3. Send Proofs to Logs[cite: 2]
        const logChannel = interaction.guild.channels.cache.get('1465599081442447392');
        if (logChannel) {
            const receiptEmbed = new EmbedBuilder().setColor(0x00FF00).setTitle('💰 Payment Receipt').setDescription(`**Seller:** ${seller}\n**Buyer:** ${buyer}\n**Item/Service:** ${itemOrService}\n**Game:** ${game}`).setImage(paymentReceipt.url);
            const tradeEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle('🤝 Trade Proof').setDescription(`Delivery confirmation for ${itemOrService}`).setImage(tradeProof.url);
            await logChannel.send({ embeds: [receiptEmbed, tradeEmbed] });
        }

        // 4. Archive/Rename/Lock Channel[cite: 15]
        const newName = interaction.channel.name.replace('purchase-', 'closed-');
        await interaction.channel.edit({
            name: newName,
            parent: '1521455074243510292',
            permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }]
        });

        await interaction.editReply('Order finalized, proof/transcript logged, seller vouched, and ticket archived!');
    },
};