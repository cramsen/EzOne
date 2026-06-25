import { Events } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client, commandsArray) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        // Push the commands to Discord
        await client.application.commands.set(commandsArray);
        console.log(`Successfully loaded ${commandsArray.length} commands!`);
    },
};