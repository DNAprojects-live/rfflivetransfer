const { SlashCommandBuilder } = require('discord.js');
const { data, save } = require('../db');
const { embed, footer, COLORS, FED_NAME, fmtSeasons, label, staffOf, teamRoleOf, hasPending, dm, newId, buttons } = require('../util');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('offer')
    .setDescription('Send a contract offer')
    .setDMPermission(false)
    .addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true))
    .addNumberOption((o) =>
      o.setName('seasons').setDescription('Seasons').setRequired(true).setMinValue(0.5).setMaxValue(10)),

  async execute(i) {
    const staff = staffOf(i.user.id);
    if (!staff) return i.editReply('❌ Managers and assistant managers only.');

    const user = i.options.getUser('user');
    const seasons = i.options.getNumber('seasons');
    if (user.bot) return i.editReply('❌ You can not sign a bot.');

    const member = await i.guild.members.fetch(user.id).catch(() => null);
    if (!member) return i.editReply('❌ User not found on the server.');
    if (teamRoleOf(member)) return i.editReply('❌ This player is already in a team.');
    if (hasPending(user.id)) return i.editReply('❌ This player already has a pending request.');

    const id = newId();
    const e = embed(i.client, COLORS.blue)
      .setTitle('Contract Received')
      .setDescription(`You have received a contract from ${label(i.guild, staff.roleId)} in **${FED_NAME}**.`)
      .addFields(
        { name: 'Contract Terms', value: `Seasons: ${fmtSeasons(seasons)}`, inline: true },
        { name: 'Contract by', value: i.member.displayName, inline: true },
      );
    footer(e, 'Please respond using the buttons below');

    const msg = await dm(user, { embeds: [e], components: [buttons(id)] });
    if (!msg) return i.editReply('❌ I could not DM this player (DMs are closed).');

    data.pending[id] = {
      type: 'offer', guildId: i.guild.id, userId: user.id, managerId: i.user.id,
      toRole: staff.roleId, seasons,
    };
    save();

    return i.editReply(`📨 Contract sent to ${user} for ${label(i.guild, staff.roleId)} (${fmtSeasons(seasons)} seasons).`);
  },
};
