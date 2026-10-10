const crypto = require('crypto');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { data } = require('./db');

const BOT_NAME = '[RFF] Live Transfer';
const FED_NAME = '[RFF] Roblox Football Federation';
const COLORS = { green: 0x2ecc71, red: 0xe74c3c, blue: 0x3498db, purple: 0x9b59b6 };

const embed = (client, color) =>
  new EmbedBuilder().setColor(color).setAuthor({ name: BOT_NAME, iconURL: client.user.displayAvatarURL() });

const footer = (e, text) => e.setFooter({ text: `${BOT_NAME} | ${text}` }).setTimestamp();

const isAdmin = (i) => i.memberPermissions?.has(PermissionFlagsBits.Administrator);

const fmtSeasons = (n) => String(n).replace('.', ',');
const fmtMoney = (n) => (n ? `$${Number(n).toLocaleString('en-US')}` : 'Free');
const userLine = (id) => `<@${id}> (${id})`;
const newId = () => crypto.randomBytes(5).toString('hex');

// manager / assistant -> their team
function staffOf(userId) {
  for (const [roleId, t] of Object.entries(data.teams)) {
    if (t.manager === userId) return { roleId, team: t, rank: 'manager' };
    if (t.assistants.includes(userId)) return { roleId, team: t, rank: 'assistant' };
  }
  return null;
}

// team role of a guild member (or null)
const teamRoleOf = (member) => Object.keys(data.teams).find((id) => member.roles.cache.has(id)) || null;

// "<emoji> Team Name"
function label(guild, roleId) {
  const t = data.teams[roleId];
  const r = guild.roles.cache.get(roleId);
  return `${t ? t.emoji : ''} ${r ? r.name : 'Unknown team'}`.trim();
}

function emojiUrl(emoji) {
  const m = /^<(a?):\w+:(\d+)>$/.exec(emoji || '');
  return m ? `https://cdn.discordapp.com/emojis/${m[2]}.${m[1] ? 'gif' : 'png'}` : null;
}

const hasPending = (userId) => Object.values(data.pending).some((p) => p.userId === userId);

async function dm(user, payload) {
  try {
    return await user.send(payload);
  } catch {
    return null;
  }
}

// type: 'sign' | 'release' | 'transfer'  (transfer falls back to the sign channel)
async function postLog(client, type, payload) {
  const ids = {
    sign: process.env.SIGN_CHANNEL_ID,
    release: process.env.RELEASE_CHANNEL_ID,
    transfer: process.env.TRANSFER_CHANNEL_ID || process.env.SIGN_CHANNEL_ID,
  };
  const ch = ids[type] ? await client.channels.fetch(ids[type]).catch(() => null) : null;
  if (ch) await ch.send(payload).catch(() => {});
}

const buttons = (id) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`req:acc:${id}`).setLabel('Accept').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`req:dec:${id}`).setLabel('Decline').setStyle(ButtonStyle.Danger),
  );

module.exports = {
  BOT_NAME, FED_NAME, COLORS, embed, footer, isAdmin, fmtSeasons, fmtMoney, userLine, newId,
  staffOf, teamRoleOf, label, emojiUrl, hasPending, dm, postLog, buttons,
};
