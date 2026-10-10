const { SlashCommandBuilder } = require('discord.js');
const { data } = require('../db');
const { embed, footer, COLORS, label, emojiUrl, staffOf, teamRoleOf } = require('../util');

const cut = (lines, max = 1000) => {
  let out = '';
  for (const l of lines) {
    if ((out + l + '\n').length > max) return out + '…';
    out += l + '\n';
  }
  return out.trim() || '—';
};

module.exports = {
  public: true,
  data: new SlashCommandBuilder()
    .setName('roster')
    .setDescription('Show a team roster')
    .setDMPermission(false)
    .addRoleOption((o) => o.setName('team').setDescription('Team role')),

  async execute(i) {
    await i.guild.members.fetch();
    let roleId = i.options.getRole('team')?.id;
    if (!roleId) roleId = staffOf(i.user.id)?.roleId ?? teamRoleOf(i.member);
    if (!roleId) return i.editReply('❌ Choose a team.');

    const team = data.teams[roleId];
    const role = i.guild.roles.cache.get(roleId);
    if (!team || !role) return i.editReply('❌ This role is not a registered team.');

    const staffIds = [team.manager, ...team.assistants].filter(Boolean);
    const players = [...role.members.values()].filter((m) => !staffIds.includes(m.id));

    const e = embed(i.client, COLORS.blue)
      .setTitle(label(i.guild, roleId))
      .setDescription(`📋 **Roster:** ${role.members.size} (${players.length} players · ${staffIds.length} staff)`)
      .addFields(
        {
          name: 'Management',
          value: cut([
            `**Manager:** ${team.manager ? `<@${team.manager}>` : '—'}`,
            `**Assistant Managers:** ${team.assistants.length ? team.assistants.map((id) => `<@${id}>`).join(', ') : '—'}`,
          ]),
        },
        {
          name: `Players (${players.length})`,
          value: cut(players.map((m, n) => `\`${String(n + 1).padStart(2, '0')}\` <@${m.id}> — ${m.displayName}`)),
        },
      );
    const url = emojiUrl(team.emoji);
    if (url) e.setThumbnail(url);
    footer(e, 'Team roster');

    return i.editReply({ embeds: [e] });
  },
};
