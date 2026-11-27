/**
 * Retro RPG / chat slash command parser.
 *
 * Supports:
 * - /roll [NdM] (defaults to 1d6, max 20 dice, max 1000 sides)
 * - /me <action>
 * - /flip
 * - /shrug [text]
 */

export interface SlashCommandResult {
  content: string;
  type: 'text' | 'system';
}

export const SLASH_COMMANDS_HELP = [
  { command: '/roll [NdM]', description: 'Roll dice (e.g. /roll 2d6)' },
  { command: '/me <action>', description: 'Send a roleplay action' },
  { command: '/flip', description: 'Flip a 16-bit coin' },
  { command: '/shrug [text]', description: 'Append ¯\\_(ツ)_/¯' },
] as const;

export function parseSlashCommand(
  rawInput: string,
  senderName: string,
  randomFn: () => number = Math.random,
): SlashCommandResult | null {
  const trimmed = rawInput.trim();
  if (!trimmed.startsWith('/')) return null;

  const [commandRaw, ...rest] = trimmed.split(/\s+/);
  const command = commandRaw.toLowerCase();
  const arg = rest.join(' ').trim();

  if (command === '/flip') {
    const outcome = randomFn() < 0.5 ? 'HEADS' : 'TAILS';
    return {
      type: 'system',
      content: `* ${senderName} flipped a coin: ${outcome}`,
    };
  }

  if (command === '/me') {
    if (!arg) return null;
    return {
      type: 'system',
      content: `* ${senderName} ${arg}`,
    };
  }

  if (command === '/shrug') {
    const shrug = '¯\\_(ツ)_/¯';
    return {
      type: 'text',
      content: arg ? `${arg} ${shrug}` : shrug,
    };
  }

  if (command === '/roll') {
    const diceSpec = arg || '1d6';
    const match = /^(\d{1,2})d(\d{1,4})$/i.exec(diceSpec);
    if (!match) {
      return {
        type: 'system',
        content: `* ${senderName} rolled invalid dice "${diceSpec}" (use NdM, e.g. 2d6)`,
      };
    }

    const count = Math.min(Math.max(parseInt(match[1], 10), 1), 20);
    const sides = Math.min(Math.max(parseInt(match[2], 10), 2), 1000);
    const rolls: number[] = [];
    for (let i = 0; i < count; i += 1) {
      rolls.push(Math.floor(randomFn() * sides) + 1);
    }
    const total = rolls.reduce((sum, n) => sum + n, 0);
    const detail = count > 1 ? ` [${rolls.join(', ')}]` : '';

    return {
      type: 'system',
      content: `* ${senderName} rolled ${count}d${sides}: ${total}${detail}`,
    };
  }

  return null;
}
