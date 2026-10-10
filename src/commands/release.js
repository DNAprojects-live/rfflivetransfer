const { SlashCommandBuilder } = require('discord.js');
const { data, save } = require('../db');
const { embed, footer, COLORS, label, staffOf, teamRoleOf, dm, postLog, userLine } = require('../util');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('Release a player')
    .setDMPermission(false)
    .addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(true).setMaxLength(300)),

  async execute(i) {
    const staff = staffOf(i.user.id);
    if (!staff) return i.editReply('❌ Managers and assistant managers only.');

    const user = i.options.getUser('user');
    const reason = i.options.getString('reason');
    const member = await i.guild.members.fetch(user.id).catch(() => null);
    if (!member) return i.editReply('❌ User not found on the server.');
    if (teamRoleOf(member) !== staff.roleId) return i.editReply('❌ This user is not in your team.');
    if (staff.team.manager === user.id) return i.editReply('❌ You can not release the manager.');

    const isAssistant = staff.team.assistants.includes(user.id);
    if (isAssistant && staff.rank !== 'manager') return i.editReply('❌ Only the manager can release an assistant.');

    try {
      await member.roles.remove(staff.roleId);
      if (isAssistant) await member.roles.remove(process.env.ASSISTANT_ROLE_ID).catch(() => {});
    } catch {
      return i.editReply('❌ I could not change roles. Check that my role is above the team role.');
    }
    if (isAssistant) staff.team.assistants = staff.team.assistants.filter((id) => id !== user.id);
    save();

    const teamLabel = label(i.guild, staff.roleId);
    const log = embed(i.client, COLORS.red)
      .setTitle('Player released ❌')
      .addFields(
        { name: 'Player', value: userLine(user.id), inline: true },
        { name: 'Manager', value: userLine(i.user.id), inline: true },
        { name: 'Team', value: teamLabel, inline: true },
        { name: 'Reason', value: reason },
      );
    footer(log, `Release made by ${i.member.displayName}.`);
    await postLog(i.client, 'release', { embeds: [log] });

    const dmEmbed = embed(i.client, COLORS.red)
      .setTitle('You have been released ❌')
      .setDescription(`You have been released from ${teamLabel}.`)
      .addFields({ name: 'Reason', value: reason });
    footer(dmEmbed, `Release made by ${i.member.displayName}.`);
    const sent = await dm(user, { embeds: [dmEmbed] });

    return i.editReply(`✅ ${user} was released from ${teamLabel}.${sent ? '' : '\n⚠️ Could not send a DM.'}`);
  },
};
