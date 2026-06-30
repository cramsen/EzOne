import { Events, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // --- OPENING A TICKET ---
        if (interaction.customId === 'create_ticket') {
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

            // Only "Close" button remains
            const closeButton = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(closeButton);
            
            await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [actionRow] });
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
    },
};