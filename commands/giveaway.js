import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { db } from '../firebase.js';

// Helper function to turn "1h 30m", "45s", "1.5h", or "90" into actual milliseconds
function parseDuration(input) {
    const trimmed = input.trim();
    
    // If they just type a raw number (e.g., "90"), default to minutes
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed) * 60000;
    }

    // Match any numbers followed by s, m, h, or d
    const regex = /(\d+(?:\.\d+)?)\s*([smhd])/gi;
    let match;
    let totalMs = 0;
    let found = false;

    while ((match = regex.exec(trimmed)) !== null) {
        found = true;
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();

        if (unit === 's') totalMs += value * 1000;
        if (unit === 'm') totalMs += value * 60000;
        if (unit === 'h') totalMs += value * 3600000;
        if (unit === 'd') totalMs += value * 86400000;
    }

    return found ? totalMs : null;
}

export default {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Opens a form to start a giveaway.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 

    async execute(interaction) {
        
        // 1. BUILD THE FORM (MODAL)
        const modal = new ModalBuilder()
            .setCustomId('giveaway_modal')
            .setTitle('Create a Giveaway');

        const prizeInput = new TextInputBuilder()
            .setCustomId('prize')
            .setLabel('Prize(s) - Use / for multiple winners')
            .setPlaceholder('e.g., $5 USDT / 30% Discount')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Duration (Use s, m, h, or d)')
            .setPlaceholder('e.g., 1h 30m, 90m, 45s')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const winnersInput = new TextInputBuilder()
            .setCustomId('winners')
            .setLabel('Number of winners (Usually 1)')
            .setPlaceholder('e.g., 1')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(prizeInput);
        const row2 = new ActionRowBuilder().addComponents(durationInput);
        const row3 = new ActionRowBuilder().addComponents(winnersInput);

        modal.addComponents(row1, row2, row3);

        // 2. SHOW THE FORM TO THE USER
        await interaction.showModal(modal);

        // 3. WAIT FOR THEM TO SUBMIT IT
        const submitted = await interaction.awaitModalSubmit({
            time: 300000, 
            filter: i => i.user.id === interaction.user.id && i.customId === 'giveaway_modal'
        }).catch(() => null);

        if (!submitted) return; 

        // 4. PROCESS THE FORM DATA
        const prize = submitted.fields.getTextInputValue('prize');
        const rawDuration = submitted.fields.getTextInputValue('duration');
        const winnersCount = parseInt(submitted.fields.getTextInputValue('winners'));

        const durationMs = parseDuration(rawDuration);

        if (!durationMs) {
            return submitted.reply({ content: '❌ Invalid duration format! Please use numbers followed by s, m, h, or d (e.g., 45s, 10m, 1h 30m).', flags: MessageFlags.Ephemeral });
        }
        if (isNaN(winnersCount) || winnersCount < 1) {
            return submitted.reply({ content: '❌ Invalid winners count! Please enter a valid number.', flags: MessageFlags.Ephemeral });
        }

        const endTime = Date.now() + durationMs;
        const endTimestamp = Math.floor(endTime / 1000); 
        
        // 5. START THE GIVEAWAY
        const embed = new EmbedBuilder()
            .setTitle('🎉 ECLIPSE ZONE GIVEAWAY 🎉')
            .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnersCount}\n**Entries:** 0\n**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n**Hosted By:** ${interaction.user}`)
            .setColor('#7500ff'); 

        const enterButton = new ButtonBuilder()
            .setCustomId('enter_giveaway')
            .setLabel('Join Giveaway')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(enterButton);

        const response = await submitted.reply({ embeds: [embed], components: [row], withResponse: true });
        const message = response.resource.message;

        // 6. SAVE TO FIREBASE INSTANTLY
        await db.ref(`giveaways/${message.id}`).set({
            channelId: submitted.channelId,
            hostId: interaction.user.id,
            prize: prize,
            winnersCount: winnersCount,
            endTime: endTime,
            entrants: {} // Empty object to hold Discord IDs
        });
    }
};