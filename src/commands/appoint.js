const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { data, save } = require('../db');
const { isAdmin, embed, COLORS, label, staffOf, dm, teamRoleOf } = require('../util');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('appoint')
    .setDescription('Appoint a team manager')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addRoleOption((o) => o.setName('team').setDescription('Team role').setRequired(true))
    .addUserOption((o) => o.setName('user').setDescription('New manager').setRequired(true)),

  async execute(i) {
    if (!isAdmin(i)) return i.editReply('❌ Admins only.');
    const teamRole = i.options.getRole('team');
    const user = i.options.getUser('user');
    const team = data.teams[teamRole.id];
    if (!team) return i.editReply('❌ This role is not a registered team. Use /add_team first.');

    const member = await i.guild.members.fetch(user.id).catch(() => null);
    if (!member) return i.editReply('❌ User not found on the server.');

    const staff = staffOf(user.id);
    if (staff && staff.roleId !== teamRole.id) return i.editReply(`❌ This user is already staff of ${label(i.guild, staff.roleId)}.`);
    if (team.manager === user.id) return i.editReply('❌ This user is already the manager of this team.');

    try {
      // remove the previous manager's manager role
      if (team.manager) {
        const old = await i.guild.members.fetch(team.manager).catch(() => null);
        if (old) await old.roles.remove(process.env.MANAGER_ROLE_ID).catch(() => {});
      }
      // leave any other team
      const other = teamRoleOf(member);
      if (other && other !== teamRole.id) await member.roles.remove(other);
      await member.roles.remove(process.env.ASSISTANT_ROLE_ID).catch(() => {});
      await member.roles.add([teamRole.id, process.env.MANAGER_ROLE_ID]);
    } catch {
      return i.editReply('❌ I could not change roles. Check that my role is above the team/manager roles.');
    }

    team.assistants = team.assistants.filter((id) => id !== user.id);
    team.manager = user.id;
    save();

    const teamLabel = label(i.guild, teamRole.id);
    const e = embed(i.client, COLORS.blue)
      .setTitle('Manager Appointed')
      .setDescription(`You have been appointed as **Manager** of ${teamLabel} in **[RFF] Roblox Football Federation**.`);
    const sent = await dm(user, { embeds: [e] });

    return i.editReply(`✅ ${user} is now the manager of ${teamLabel}.${sent ? '' : '\n⚠️ Could not send a DM.'}`);
  },
};
