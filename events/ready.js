import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db } from '../firebase.js'; // Added Firebase Import

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client, commandsArray) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        // Push the commands to Discord
        await client.application.commands.set(commandsArray);
        console.log(`Successfully loaded ${commandsArray.length} commands!`);

        // --- GIVEAWAY CHECKER LOOP ---
        setInterval(async () => {
            const snapshot = await db.ref('giveaways').once('value');
            const giveaways = snapshot.val();
            
            if (!giveaways) return; // Exit if no active giveaways exist

            const now = Date.now();

            for (const [messageId, data] of Object.entries(giveaways)) {
                // If the giveaway timer has expired
                if (now >= data.endTime) {
                    try {
                        const channel = await client.channels.fetch(data.channelId);
                        if (!channel) continue;
                        
                        const message = await channel.messages.fetch(messageId).catch(() => null);
                        let entrants = data.entrants ? Object.keys(data.entrants) : [];
                        
                        // Parse multi-prizes if separated by a "/"
                        const prizeList = data.prize.split('/').map(p => p.trim());
                        let resultText = '';
                        let annoucementText = '';

                        if (entrants.length === 0) {
                            resultText = `**Prize(s):** ${data.prize}\n**Entries:** 0\n**Ended!** No one entered.\n**Hosted By:** <@${data.hostId}>`;
                            annoucementText = `The trials are empty. No disciples stepped forward to claim **${data.prize}**! 🍃`;
                        } else {
                            resultText = `**Entries:** ${entrants.length}\n**Ended!**\n\n🏆 **Winners:**\n`;
                            annoucementText = `🎉 **Giveaway Results for ${data.prize}:**\n`;

                            // Shuffle entrants
                            entrants = entrants.sort(() => 0.5 - Math.random());

                            // Draw for each prize dynamically
                            for (let i = 0; i < prizeList.length; i++) {
                                const currentPrize = prizeList[i];
                                
                                if (entrants.length === 0) {
                                    resultText += `• **${currentPrize}:** No entrants left!\n`;
                                    continue;
                                }

                                // Pull the top winner off the shuffled list
                                const winnerId = entrants.shift();
                                
                                resultText += `• **${currentPrize}:** <@${winnerId}>\n`;
                                annoucementText += `🏆 **Trial Victor:** Congratulations <@${winnerId}>! You have proven worthy of **${currentPrize}**. report to <@${data.hostId}> immediately to claim your spoils.\n`;
                            }
                        }

                        // Update the original message embed
                        if (message) {
                            const embed = EmbedBuilder.from(message.embeds[0])
                                .setDescription(resultText)
                                .setColor('#43B581');

                            const disabledButton = new ButtonBuilder()
                                .setCustomId('enter_giveaway')
                                .setLabel(`Ended (${data.entrants ? Object.keys(data.entrants).length : 0} entries)`)
                                .setEmoji('🎉')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true);
                                
                            const disabledRow = new ActionRowBuilder().addComponents(disabledButton);

                            await message.edit({ embeds: [embed], components: [disabledRow] });
                        }

                        // Send the final result ping
                        await channel.send(annoucementText);

                    } catch (error) {
                        console.error(`Failed to end giveaway ${messageId}:`, error);
                    } finally {
                        // Delete the giveaway from Firebase so it doesn't trigger again
                        await db.ref(`giveaways/${messageId}`).remove();
                    }
                }
            }
        }, 5000); // Ticks every 5 seconds
    },
};