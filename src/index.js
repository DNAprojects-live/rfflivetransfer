require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const handleButton = require('./buttons');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.commands = new Collection();
for (const f of fs.readdirSync(path.join(__dirname, 'commands')).filter((f) => f.endsWith('.js'))) {
  const cmd = require(`./commands/${f}`);
  client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('interactionCreate', async (i) => {
  try {
    if (i.isButton()) return await handleButton(i);
    if (!i.isChatInputCommand()) return;
    const cmd = client.commands.get(i.commandName);
    if (!cmd) return;
    await i.deferReply(cmd.public ? {} : { flags: 64 });
    await cmd.execute(i);
  } catch (err) {
    console.error(err);
    const msg = '❌ Something went wrong.';
    if (i.deferred || i.replied) i.editReply({ content: msg }).catch(() => {});
    else i.reply({ content: msg, flags: 64 }).catch(() => {});
  }
});

client.login(process.env.TOKEN);
