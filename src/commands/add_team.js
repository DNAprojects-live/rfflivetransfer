const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { data, save } = require('../db');
const { isAdmin, embed, COLORS } = require('../util');

const EMOJI_RE = /^<a?:\w+:\d+>$|\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add_team')
    .setDescription('Add a team')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addRoleOption((o) => o.setName('role').setDescription('Team role').setRequired(true))
    .addStringOption((o) => o.setName('emoji').setDescription('Team emoji').setRequired(true)),

  async execute(i) {
    if (!isAdmin(i)) return i.editReply('❌ Admins only.');
    const role = i.options.getRole('role');
    const emoji = i.options.getString('emoji').trim();
    if (!EMOJI_RE.test(emoji)) return i.editReply('❌ Invalid emoji.');

    const old = data.teams[role.id];
    data.teams[role.id] = { emoji, manager: old?.manager ?? null, assistants: old?.assistants ?? [] };
    save();

    const e = embed(i.client, COLORS.green).setDescription(`${old ? 'Team updated' : 'Team added'}: ${emoji} ${role}`);
    return i.editReply({ embeds: [e] });
  },
};
