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
                const ticketChannel = await interaction.guild.channels.create({
                    name: `purchase-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    parent: '1465599024752099481', 
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    ],
                });

                const ticketEmbed = new EmbedBuilder()
                    .setTitle('Purchase Ticket Opened 💸')
                    .setDescription('Welcome! Please let us know what you would like to buy and your preferred payment method. A staff member will be right with you.\n\n*A staff member will use the /complete-order command to finalize this ticket when finished.*')
                    .setColor('#7500ff'); 

                const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger);
                const actionRow = new ActionRowBuilder().addComponents(closeButton);
                
                await ticketChannel.send({ content: `<@${interaction.user.id}> <@&1465599379997200539>`, embeds: [ticketEmbed], components: [actionRow] });
                await interaction.reply({ content: `Your purchase ticket has been created: ${ticketChannel}`, flags: MessageFlags.Ephemeral });
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