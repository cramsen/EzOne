import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('proof')
        .setDescription('Upload payment and trade proofs for a transaction')
        .addUserOption(option => 
            option.setName('buyer')
                .setDescription('The person who bought the item')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('item')
                .setDescription('What item or service was sold?')
                .setRequired(true))
        // New option for the Vouch ID
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
        const buyer = interaction.options.getUser('buyer');
        const item = interaction.options.getString('item');
        const vouchId = interaction.options.getInteger('vouch_id'); // Grabbing the vouch number
        const paymentReceipt = interaction.options.getAttachment('payment_receipt');
        const tradeProof = interaction.options.getAttachment('trade_proof');
        const seller = interaction.user; 

        // 1. Build the Payment Receipt Embed
        const receiptEmbed = new EmbedBuilder()
            .setColor(0x00FF00) 
            .setTitle(`💰 Payment Receipt (Vouch #${vouchId})`) // Added Vouch ID to the title
            .setDescription(`**Seller:** ${seller}\n**Buyer:** ${buyer}\n**Item:** ${item}`)
            .setImage(paymentReceipt.url)
            .setFooter({ text: `Linked to Vouch ID: ${vouchId}` })
            .setTimestamp();

        // 2. Build the Trade Proof Embed
        const tradeEmbed = new EmbedBuilder()
            .setColor(0x0099FF) 
            .setTitle(`🤝 Trade Proof (Vouch #${vouchId})`) // Added Vouch ID to the title
            .setDescription(`Delivery confirmation for ${item}`)
            .setImage(tradeProof.url)
            .setFooter({ text: `Linked to Vouch ID: ${vouchId}` })
            .setTimestamp();

        // 3. Send both embeds
        await interaction.reply({ embeds: [receiptEmbed, tradeEmbed] });
    },
};