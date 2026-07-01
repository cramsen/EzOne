import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const PROOFS_CHANNEL_ID = '1465598921119371387'; // Locked to your #proofs channel

export default {
    data: new SlashCommandBuilder()
        .setName('proof')
        .setDescription('Upload payment and trade proofs for a transaction')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) 
        .addUserOption(option => 
            option.setName('buyer')
                .setDescription('The person who bought the item')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('item')
                .setDescription('What item or service was sold?')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('vouch_id')
                .setDescription('The Vouch # this proof belongs to')
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('payment_receipt')
                .setDescription('Screenshot of the payment')
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('trade_proof')
                .setDescription('Screenshot of the completed trade/delivery')
                .setRequired(true)),
                
    async execute(interaction) {
        // Defer the reply so it doesn't time out while processing images
        await interaction.deferReply({ ephemeral: true });

        const buyer = interaction.options.getUser('buyer');
        const item = interaction.options.getString('item');
        const vouchId = interaction.options.getInteger('vouch_id'); 
        const paymentReceipt = interaction.options.getAttachment('payment_receipt');
        const tradeProof = interaction.options.getAttachment('trade_proof');
        const seller = interaction.user; 

        // 1. Build the Payment Receipt Embed
        const receiptEmbed = new EmbedBuilder()
            .setColor(0x00FF00) 
            .setTitle(`💰 Payment Receipt (Vouch #${vouchId})`) 
            .setDescription(`**Seller:** ${seller}\n**Buyer:** ${buyer}\n**Item:** ${item}`)
            .setImage(paymentReceipt.url)
            .setFooter({ text: `Linked to Vouch ID: ${vouchId}` })
            .setTimestamp();

        // 2. Build the Trade Proof Embed
        const tradeEmbed = new EmbedBuilder()
            .setColor(0x0099FF) 
            .setTitle(`🤝 Trade Proof (Vouch #${vouchId})`) 
            .setDescription(`Delivery confirmation for ${item}`)
            .setImage(tradeProof.url)
            .setFooter({ text: `Linked to Vouch ID: ${vouchId}` })
            .setTimestamp();

        // 3. Find the designated proofs channel
        const proofsChannel = interaction.client.channels.cache.get(PROOFS_CHANNEL_ID);

        if (proofsChannel) {
            // Send embeds to the specific channel
            await proofsChannel.send({ embeds: [receiptEmbed, tradeEmbed] });
            
            // Send a silent confirmation back to the admin who ran the command
            await interaction.editReply(`✅ Proofs successfully logged to ${proofsChannel}!`);
        } else {
            // Error handling if the ID is wrong or missing
            await interaction.editReply('⚠️ Could not find the proofs channel! Please double-check the ID at the top of the code.');
        }
    },
};