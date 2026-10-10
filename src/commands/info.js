const { SlashCommandBuilder } = require('discord.js');
const { embed, footer, COLORS, label, teamRoleOf } = require('../util');

const clean = (s) => (s || '').replace(/\(@?.*?\)/g, '').trim();

async function getRoblox(member) {
  let id = null;
  if (process.env.BLOXLINK_API_KEY) {
    try {
      const r = await fetch(`https://api.blox.link/v4/public/guilds/${member.guild.id}/discord-to-roblox/${member.id}`, {
        headers: { Authorization: process.env.BLOXLINK_API_KEY },
      });
      id = (await r.json()).robloxID || null;
    } catch {}
  }
  if (!id) {
    // fallback: try nickname / username as a Roblox username
    const names = [...new Set([clean(member.nickname), member.user.globalName, member.user.username].filter(Boolean))];
    try {
      const r = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: names, excludeBannedUsers: false }),
      });
      id = (await r.json()).data?.[0]?.id || null;
    } catch {}
  }
  if (!id) return null;
  try {
    const u = await (await fetch(`https://users.roblox.com/v1/users/${id}`)).json();
    let avatar = null;
    try {
      const t = await (await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=150x150&format=Png`)).json();
      avatar = t.data?.[0]?.imageUrl || null;
    } catch {}
    return { id, name: u.name, displayName: u.displayName, created: u.created, avatar };
  } catch {
    return null;
  }
}

module.exports = {
  public: true,
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Player info')
    .setDMPermission(false)
    .addUserOption((o) => o.setName('user').setDescription('Player')),

  async execute(i) {
    const user = i.options.getUser('user') ?? i.user;
    const member = await i.guild.members.fetch(user.id).catch(() => null);
    if (!member) return i.editReply('❌ User not found on the server.');

    const rb = await getRoblox(member);
    const teamRoleId = teamRoleOf(member);
    const roles = member.roles.cache.filter((r) => r.id !== i.guild.id).sort((a, b) => b.position - a.position);

    const e = embed(i.client, COLORS.purple).setTitle(`Info — ${rb ? rb.name : member.displayName}`);
    if (rb) {
      const ts = Math.floor(new Date(rb.created).getTime() / 1000);
      e.addFields(
        { name: 'Player', value: `[${rb.name}](https://www.roblox.com/users/${rb.id}/profile)\n\`${rb.id}\``, inline: true },
        { name: 'Display Name', value: rb.displayName, inline: true },
        { name: 'Account Created', value: `<t:${ts}:D> • <t:${ts}:R>` },
      );
      if (rb.avatar) e.setThumbnail(rb.avatar);
    } else {
      e.addFields({ name: 'Roblox', value: 'Account not linked' });
      e.setThumbnail(member.displayAvatarURL());
    }
    e.addFields(
      { name: 'Discord', value: `${user}\n\`${user.id}\``, inline: true },
      { name: 'Top Role', value: roles.size ? `${roles.first()}` : 'None', inline: true },
      { name: 'Server Roles', value: roles.size ? [...roles.values()].slice(0, 15).join(' ') : 'None' },
      { name: 'Team', value: teamRoleId ? label(i.guild, teamRoleId) : 'None' },
    );
    footer(e, 'Player info');

    return i.editReply({ embeds: [e] });
  },
};
