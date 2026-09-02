export type CommandExecution = 'client' | 'server';

export interface ParsedSlashCommand {
  name: string;
  args: string[];
}

export interface CommandDefinition {
  id: string;
  aliases: string[];
  usage: string;
  group: 'help' | 'mode' | 'ai';
  execution: CommandExecution;
  description: string;
}

export const COMMAND_REGISTRY = {
  help: {
    id: 'help', aliases: [], usage: '/help [topic]', group: 'help', execution: 'client', description: 'Show command help.',
  },
  creative: {
    id: 'creative', aliases: [], usage: '/creative', group: 'mode', execution: 'client', description: 'Enable creative flight mode.',
  },
  survival: {
    id: 'survival', aliases: [], usage: '/survival', group: 'mode', execution: 'client', description: 'Enable survival mode.',
  },
  ai: {
    id: 'ai', aliases: [], usage: '/ai place <description>', group: 'ai', execution: 'server', description: 'Request a bounded server-validated structure.',
  },
} as const satisfies Record<string, CommandDefinition>;

const HELP: Record<string, string> = {
  overview: 'Commands: /help [topic], /creative, /survival. Type ordinary text to chat with players in this realm.',
  controls: 'Controls: WASD move · Shift sprint · Space jump · mouse look · left click mine · right click place · 1/2/3 select block · F attack · B place hut · Enter chat · Escape close chat.',
  commands: `Commands: ${Object.values(COMMAND_REGISTRY).map((command) => command.usage).join(', ')}.`,
  voice: 'Voice: push-to-talk is planned. It will be opt-in, browser-dependent, and muted from Settings when enabled.',
  ai: 'AI: /ai place <description> is planned for bounded, server-validated structures. It is not available in this slice.',
};

export function parseSlashCommand(raw: string): ParsedSlashCommand | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return null;
  const parts = trimmed.slice(1).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { name: '', args: [] };
  return { name: parts[0].toLowerCase(), args: parts.slice(1) };
}

export function getHelpText(topic = 'overview'): string {
  return HELP[topic.toLowerCase()] || `Unknown help topic: ${topic}. Try /help, /help controls, or /help commands.`;
}