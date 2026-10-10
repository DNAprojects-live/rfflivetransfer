const { SlashCommandBuilder } = require('discord.js');
const { data, save } = require('../db');
const { embed, footer, COLORS, fmtMoney, label, staffOf, teamRoleOf, hasPending, dm, newId, buttons } = require('../util');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer a player to your team')
    .setDMPermission(false)
    .addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true))
    .addIntegerOption((o) => o.setName('fee').setDescription('Transfer fee').setMinValue(0)),

  async execute(i) {
    const staff = staffOf(i.user.id);
    if (!staff) return i.editReply('❌ Managers and assistant managers only.');

    const user = i.options.getUser('user');
    const fee = i.options.getInteger('fee') ?? 0;
    const member = await i.guild.members.fetch(user.id).catch(() => null);
    if (!member) return i.editReply('❌ User not found on the server.');

    const fromRole = teamRoleOf(member);
    if (!fromRole) return i.editReply('❌ This player has no team. Use /offer instead.');
    if (fromRole === staff.roleId) return i.editReply('❌ This player is already in your team.');
    if (staffOf(user.id)) return i.editReply('❌ You can not transfer team staff.');
    if (hasPending(user.id)) return i.editReply('❌ This player already has a pending request.');

    const from = label(i.guild, fromRole);
    const to = label(i.guild, staff.roleId);
    const id = newId();

    const e = embed(i.client, COLORS.blue)
      .setTitle('Transfer Request')
      .setDescription(`Do you agree to transfer to **${to}** from **${from}**?`)
      .addFields(
        { name: 'From Team', value: from, inline: true },
        { name: 'To Team', value: to, inline: true },
        { name: 'Transfer Fee', value: fmtMoney(fee), inline: true },
        { name: 'Requested by', value: i.member.displayName, inline: true },
      );
    footer(e, 'Please respond using the buttons below');

    const msg = await dm(user, { embeds: [e], components: [buttons(id)] });
    if (!msg) return i.editReply('❌ I could not DM this player (DMs are closed).');

    data.pending[id] = {
      type: 'transfer', guildId: i.guild.id, userId: user.id, managerId: i.user.id,
      fromRole, toRole: staff.roleId, fee,
    };
    save();

    return i.editReply(`📨 Transfer request sent to ${user}: ${from} ➜ ${to}.`);
  },
};
