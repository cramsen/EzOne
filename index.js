import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import fs from 'node:fs';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.commands = new Collection();
const commandsArray = [];

// ==========================================
// 1. LOAD COMMANDS
// ==========================================
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const commandFile = await import(`./commands/${file}`);
    const command = commandFile.default;
    client.commands.set(command.data.name, command);
    commandsArray.push(command.data);
}

// ==========================================
// 2. LOAD EVENTS
// ==========================================
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const eventFile = await import(`./events/${file}`);
    const event = eventFile.default;
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, commandsArray));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// ==========================================
// 3. TICKET BUTTON LOGIC
// ==========================================
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        
        // --- OPENING A TICKET ---
        if (interaction.customId === 'create_ticket') {
            const ticketChannel = await interaction.guild.channels.create({
                name: `purchase-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: '1465599024752099481', 
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    },
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle('Purchase Ticket Opened 💸')
                .setDescription('Welcome! Please let us know what you would like to buy and your preferred payment method. A staff member will be right with you.\n\n*A staff member will mark this ticket as complete and close it when finished.*')
                .setColor('#7500ff'); 

            const completeButton = new ButtonBuilder()
                .setCustomId('complete_ticket')
                .setLabel('Mark as Complete')
                .setStyle(ButtonStyle.Success);

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(completeButton, closeButton);
            
            await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [actionRow] });
            await interaction.reply({ content: `Your purchase ticket has been created: ${ticketChannel}`, flags: MessageFlags.Ephemeral });
        } 
        
        // --- CLOSING/COMPLETING A TICKET ---
        else if (interaction.customId === 'close_ticket' || interaction.customId === 'complete_ticket') {
            
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ 
                    content: 'Only server staff can close or complete tickets.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            const isComplete = interaction.customId === 'complete_ticket';

            if (isComplete) {
                await interaction.reply({ 
                    content: 'Logging order and locking ticket...', 
                    flags: MessageFlags.Ephemeral 
                });

                const logChannel = interaction.guild.channels.cache.get('1465599081442447392');
                    
                if (logChannel) {
                    // Build Completion Embed
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Order Completed ✅')
                        .addFields(
                            { name: 'Ticket Name', value: interaction.channel.name, inline: true },
                            { name: 'Handled By', value: `<@${interaction.user.id}>`, inline: true }
                        )
                        .setColor('#43B581')
                        .setTimestamp();
                    
                    // Send Log
                    await logChannel.send({ embeds: [logEmbed] });
                }
            } else {
                // If it's just 'close_ticket', acknowledge quietly without logging
                await interaction.reply({ 
                    content: 'Deleting canceled ticket...', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            // Finally, delete the original ticket channel for both actions
            setTimeout(() => {
                if (interaction.channel) {
                    interaction.channel.delete().catch(console.error);
                }
            }, 3000); 
        }
    }
});

// Log in
client.login(process.env.TOKEN);