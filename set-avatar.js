require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('ready', async () => {
  await client.user.setAvatar('./logo.png');
  console.log('Avatar updated');
  process.exit(0);
});
client.login(process.env.TOKEN);
