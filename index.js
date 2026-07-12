import 'dotenv/config';
//console.log("Is TOKEN loaded?", !!process.env.TOKEN);
//console.log("Is FIREBASE_SERVICE_ACCOUNT loaded?", !!process.env.FIREBASE_SERVICE_ACCOUNT);
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

// Log in
client.login(process.env.TOKEN);