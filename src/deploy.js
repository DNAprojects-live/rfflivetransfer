require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = fs
  .readdirSync(path.join(__dirname, 'commands'))
  .filter((f) => f.endsWith('.js'))
  .map((f) => require(`./commands/${f}`).data.toJSON());

const rest = new REST().setToken(process.env.TOKEN);
const route = process.env.GUILD_ID
  ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
  : Routes.applicationCommands(process.env.CLIENT_ID);

rest.put(route, { body: commands }).then(() => console.log(`Registered ${commands.length} commands`)).catch(console.error);
