import {
  DEV_APP_HOST,
  DEV_MARKETING_HOST,
  PROD_APP_HOST,
  PROD_MARKETING_HOST,
  isProductionEnvironment,
} from './hosts.js';

/** Common AI / LLM training and retrieval crawlers (robots.txt user-agent names). */
export const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'CCBot',
  'FacebookBot',
  'meta-externalagent',
  'Amazonbot',
  'cohere-ai',
  'Diffbot',
  'PerplexityBot',
  'YouBot',
] as const;

export type RobotsPolicy = 'production-marketing' | 'block-all';

const PUBLIC_MARKETING_PATHS = ['/', '/security', '/privacy'] as const;

export function robotsPolicy(hostname: string, environment: string): RobotsPolicy {
  if (
    isProductionEnvironment(environment) &&
    (hostname === PROD_MARKETING_HOST || hostname === 'www.dialyrounds.com')
  ) {
    return 'production-marketing';
  }
  return 'block-all';
}

function appendAllowRules(lines: string[], paths: readonly string[]): void {
  for (const path of paths) {
    lines.push(`Allow: ${path}`);
  }
}

function appendDisallowAll(lines: string[]): void {
  lines.push('Disallow: /');
}

/** Block every crawler, including AI bots, on app and dev hosts. */
export function buildBlockAllRobotsTxt(): string {
  const lines: string[] = ['User-agent: *'];
  appendDisallowAll(lines);
  lines.push('');

  for (const agent of AI_CRAWLER_USER_AGENTS) {
    lines.push(`User-agent: ${agent}`);
    appendDisallowAll(lines);
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

/**
 * Production marketing: public pages may be crawled by search engines and named AI bots.
 * App paths are not served on this host (redirected to the app subdomain).
 */
export function buildProductionMarketingRobotsTxt(): string {
  const lines: string[] = ['User-agent: *'];
  appendAllowRules(lines, PUBLIC_MARKETING_PATHS);
  lines.push('');

  for (const agent of AI_CRAWLER_USER_AGENTS) {
    lines.push(`User-agent: ${agent}`);
    appendAllowRules(lines, PUBLIC_MARKETING_PATHS);
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

export function buildRobotsTxt(hostname: string, environment: string): string {
  return robotsPolicy(hostname, environment) === 'production-marketing'
    ? buildProductionMarketingRobotsTxt()
    : buildBlockAllRobotsTxt();
}

export function isDevDeployHost(hostname: string): boolean {
  return hostname === DEV_MARKETING_HOST || hostname === DEV_APP_HOST;
}

export function isProdAppHost(hostname: string): boolean {
  return hostname === PROD_APP_HOST;
}
