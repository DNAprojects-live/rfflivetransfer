const { SlashCommandBuilder } = require('discord.js');
const { data, save } = require('../db');
const { embed, COLORS, label, staffOf, dm, teamRoleOf } = require('../util');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assistant_appoint')
    .setDescription('Appoint an assistant manager')
    .setDMPermission(false)
    .addUserOption((o) => o.setName('user').setDescription('Assistant manager').setRequired(true)),

  async execute(i) {
    const staff = staffOf(i.user.id);
    if (!staff || staff.rank !== 'manager') return i.editReply('❌ Managers only.');

    const user = i.options.getUser('user');
    if (user.bot) return i.editReply('❌ You can not appoint a bot.');
    if (staffOf(user.id)) return i.editReply('❌ This user is already staff.');

    const member = await i.guild.members.fetch(user.id).catch(() => null);
    if (!member) return i.editReply('❌ User not found on the server.');
    const current = teamRoleOf(member);
    if (current && current !== staff.roleId) return i.editReply(`❌ This user plays for ${label(i.guild, current)}.`);

    try {
      await member.roles.add([staff.roleId, process.env.ASSISTANT_ROLE_ID]);
    } catch {
      return i.editReply('❌ I could not change roles. Check that my role is above the team/assistant roles.');
    }

    staff.team.assistants.push(user.id);
    save();

    const teamLabel = label(i.guild, staff.roleId);
    const e = embed(i.client, COLORS.blue)
      .setTitle('Assistant Manager Appointed')
      .setDescription(`You have been appointed as **Assistant Manager** of ${teamLabel} by ${i.user}.`);
    const sent = await dm(user, { embeds: [e] });

    return i.editReply(`✅ ${user} is now an assistant manager of ${teamLabel}.${sent ? '' : '\n⚠️ Could not send a DM.'}`);
  },
};
