const { data, save } = require('./db');
const { embed, footer, COLORS, FED_NAME, fmtSeasons, fmtMoney, label, teamRoleOf, dm, postLog, userLine } = require('./util');

// Accept / Decline buttons from the DM (offer + transfer)
module.exports = async function handleButton(i) {
  const [ns, action, id] = i.customId.split(':');
  if (ns !== 'req') return;

  const p = data.pending[id];
  if (!p) return i.update({ components: [] }).catch(() => {});
  if (i.user.id !== p.userId) return i.reply({ content: 'This request is not for you.', flags: 64 });

  delete data.pending[id];
  save();
  await i.update({ components: [] });

  const client = i.client;
  const guild = client.guilds.cache.get(p.guildId);
  const member = await guild.members.fetch(p.userId).catch(() => null);
  const manager = await client.users.fetch(p.managerId).catch(() => null);
  const accept = action === 'acc';
  const name = member?.displayName ?? i.user.username;
  const mName = manager?.username ?? 'manager';
  const to = label(guild, p.toRole);

  const fail = async (text) => {
    await i.followUp({ embeds: [embed(client, COLORS.red).setDescription(`❌ ${text}`)] });
    if (manager) await dm(manager, { embeds: [embed(client, COLORS.red).setDescription(`❌ ${name}: request failed — ${text}`)] });
  };

  // ───────── OFFER ─────────
  if (p.type === 'offer') {
    if (!accept) {
      const e = embed(client, COLORS.red).setTitle(FED_NAME)
        .setDescription(`**You have declined the contract!**\n${name}, you have declined the contract from ${to} managed by ${mName}`);
      await i.followUp({ embeds: [e] });
      if (manager) {
        const m = embed(client, COLORS.red).setTitle('Contract declined ❌')
          .setDescription(`**${name}** declined your contract offer for ${to}.`);
        await dm(manager, { embeds: [m] });
      }
      return;
    }

    if (!member) return fail('player not found on the server.');
    if (teamRoleOf(member)) return fail('you already belong to a team.');
    try {
      await member.roles.add(p.toRole);
    } catch {
      return fail('I could not give the team role.');
    }

    const e = embed(client, COLORS.green).setTitle(FED_NAME)
      .setDescription(`**You have accepted the contract!**\n${name}, you have signed to ${to} managed by ${mName}`);
    await i.followUp({ embeds: [e] });

    if (manager) {
      const m = embed(client, COLORS.green).setTitle('Contract accepted ✅')
        .setDescription(`**${name}** accepted your contract offer for ${to} (${fmtSeasons(p.seasons)} seasons).`);
      await dm(manager, { embeds: [m] });
    }

    const log = embed(client, COLORS.green).setTitle('Player signed ✅').addFields(
      { name: 'Player', value: userLine(p.userId), inline: true },
      { name: 'Manager', value: userLine(p.managerId), inline: true },
      { name: 'Team', value: to, inline: true },
      { name: 'Seasons', value: fmtSeasons(p.seasons) },
    );
    footer(log, `Signed by ${mName}.`);
    return postLog(client, 'sign', { embeds: [log] });
  }

  // ───────── TRANSFER ─────────
  if (p.type === 'transfer') {
    const from = label(guild, p.fromRole);

    if (!accept) {
      const e = embed(client, COLORS.red).setTitle(FED_NAME)
        .setDescription(`**You have declined the transfer!**\n${name}, you have declined the transfer from ${from} to ${to}`);
      await i.followUp({ embeds: [e] });
      if (manager) {
        const m = embed(client, COLORS.red).setTitle('Transfer declined ❌')
          .setDescription(`**${name}** declined the transfer from ${from} to ${to}.`);
        await dm(manager, { embeds: [m] });
      }
      return;
    }

    if (!member || !member.roles.cache.has(p.fromRole)) return fail('you are no longer in the previous team.');
    try {
      await member.roles.remove(p.fromRole);
      await member.roles.add(p.toRole);
    } catch {
      return fail('I could not change the team roles.');
    }

    const e = embed(client, COLORS.green).setTitle(FED_NAME)
      .setDescription(`**You have accepted the transfer!**\n${name}, you have transferred from ${from} to ${to}`);
    await i.followUp({ embeds: [e] });

    if (manager) {
      const m = embed(client, COLORS.green).setTitle('Transfer accepted ✅')
        .setDescription(`**${name}** joined ${to} from ${from}.`);
      await dm(manager, { embeds: [m] });
    }
    const oldTeam = data.teams[p.fromRole];
    if (oldTeam?.manager && oldTeam.manager !== p.managerId) {
      const oldM = await client.users.fetch(oldTeam.manager).catch(() => null);
      if (oldM) {
        const m = embed(client, COLORS.blue).setTitle('Player transferred')
          .setDescription(`**${name}** left ${from} and joined ${to}.`);
        await dm(oldM, { embeds: [m] });
      }
    }

    const log = embed(client, COLORS.green).setTitle('Player Transfer ✅').addFields(
      { name: 'Player', value: userLine(p.userId) },
      { name: 'From Team', value: from, inline: true },
      { name: 'To Team', value: to, inline: true },
      { name: 'Transfer Fee', value: fmtMoney(p.fee) },
    );
    footer(log, `Transfer made by ${mName}.`);
    return postLog(client, 'transfer', { embeds: [log] });
  }
};
