import { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { db } from '../firebase.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        
        // ==========================================
        // 1. HANDLE SLASH COMMANDS
        // ==========================================
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
            return; // Exit after handling command
        }

        // ==========================================
        // 2. HANDLE BUTTON CLICK INTERACTIONS
        // ==========================================
        if (interaction.isButton()) {
            
            // --- ENTERING A GIVEAWAY ---
            if (interaction.customId === 'enter_giveaway') {
                const messageId = interaction.message.id;
                const userId = interaction.user.id;
                const giveawayRef = db.ref(`giveaways/${messageId}`);

                const snapshot = await giveawayRef.once('value');
                if (!snapshot.exists()) {
                    return interaction.reply({ content: 'This giveaway has already ended or does not exist!', flags: MessageFlags.Ephemeral });
                }

                const giveawayData = snapshot.val();
                
                // Check if they already entered
                if (giveawayData.entrants && giveawayData.entrants[userId]) {
                    return interaction.reply({ content: 'You have already entered this giveaway! Good luck!', flags: MessageFlags.Ephemeral });
                }

                // Save entry to Firebase
                await db.ref(`giveaways/${messageId}/entrants/${userId}`).set(true);

                // Update embed with new entry count
                const entrantsCount = giveawayData.entrants ? Object.keys(giveawayData.entrants).length + 1 : 1;
                const endTimestamp = Math.floor(giveawayData.endTime / 1000);
                
                // Formats nicely whether it's one prize or multi-prize
                const embed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setDescription(`**Prize:** ${giveawayData.prize}\n**Entries:** ${entrantsCount}\n**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n**Hosted By:** <@${giveawayData.hostId}>`);

                await interaction.message.edit({ embeds: [embed] }).catch(console.error);
                await interaction.reply({ content: 'You have successfully entered the giveaway! 🎉', flags: MessageFlags.Ephemeral });
            } 
            
            // --- OPENING A TICKET ---
else if (interaction.customId === 'create_ticket') {
    // Generates a channel mimicking a dojo request line
    const ticketChannel = await interaction.guild.channels.create({
        name: `dojo-request-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: '1465599024752099481', // Make sure your category ID matches your new setup!
        permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ],
    });

    const ticketEmbed = new EmbedBuilder()
        .setTitle('⛩️ Dojo Request Opened')
        .setDescription('State your business within the Shinazugawa Dojo. If you are here to acquire assets, secure boosting services, or trade items, outline your request clearly along with your target payment method.\n\n*A Dojo Overseer will arrive shortly. Do not waste the Wind Hashira\'s time.*')
        .setColor('#BC1A22') // Sanemi Scar Red

    const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Dismiss Request')
        .setStyle(ButtonStyle.Danger);
        
    const actionRow = new ActionRowBuilder().addComponents(closeButton);
    
    // Kept your internal Role ID pings exactly the same so your staff notifications don't break!
    await ticketChannel.send({ content: `<@${interaction.user.id}> <@&1465599379997200539>`, embeds: [ticketEmbed], components: [actionRow] });
    await interaction.reply({ content: `Your dojo petition has been raised here: ${ticketChannel}`, flags: MessageFlags.Ephemeral });
}
            
            // --- CLOSING A TICKET ---
            else if (interaction.customId === 'close_ticket') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'Only server staff can close tickets.', flags: MessageFlags.Ephemeral });
                }

                await interaction.reply({ content: 'Deleting ticket...', flags: MessageFlags.Ephemeral });
                setTimeout(() => interaction.channel.delete().catch(console.error), 3000);
            }
        }
    },
};