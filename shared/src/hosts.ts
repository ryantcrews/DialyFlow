export const PROD_MARKETING_HOST = 'dialyrounds.com';
export const PROD_APP_HOST = 'app.dialyrounds.com';
export const DEV_MARKETING_HOST = 'dev.dialyrounds.com';
export const DEV_APP_HOST = 'devapp.dialyrounds.com';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export function isProductionEnvironment(environment: string): boolean {
  return environment === 'production';
}

export function isAppHost(hostname: string, environment: string): boolean {
  if (LOCAL_HOSTS.has(hostname)) return true;
  if (isProductionEnvironment(environment)) {
    return hostname === PROD_APP_HOST;
  }
  return hostname === PROD_APP_HOST || hostname === DEV_APP_HOST;
}

export function isMarketingHost(hostname: string, environment: string): boolean {
  if (hostname === 'www.dialyrounds.com') return true;
  if (isProductionEnvironment(environment)) {
    return hostname === PROD_MARKETING_HOST;
  }
  return hostname === PROD_MARKETING_HOST || hostname === DEV_MARKETING_HOST;
}

export function appHostForEnvironment(environment: string): string {
  return isProductionEnvironment(environment) ? PROD_APP_HOST : DEV_APP_HOST;
}

export function marketingHostForEnvironment(environment: string): string {
  return isProductionEnvironment(environment) ? PROD_MARKETING_HOST : DEV_MARKETING_HOST;
}

export function appOriginForEnvironment(environment: string): string {
  return `https://${appHostForEnvironment(environment)}`;
}

export function marketingOriginForEnvironment(environment: string): string {
  return `https://${marketingHostForEnvironment(environment)}`;
}

export function appHostForHostname(hostname: string): string {
  if (hostname === DEV_MARKETING_HOST || hostname === DEV_APP_HOST) return DEV_APP_HOST;
  return PROD_APP_HOST;
}

export function appOriginForHostname(hostname: string): string {
  return `https://${appHostForHostname(hostname)}`;
}

export function marketingHostForHostname(hostname: string): string {
  if (hostname === DEV_MARKETING_HOST || hostname === DEV_APP_HOST) return DEV_MARKETING_HOST;
  return PROD_MARKETING_HOST;
}

export function marketingOriginForHostname(hostname: string): string {
  return `https://${marketingHostForHostname(hostname)}`;
}

export function isApiHost(hostname: string, environment: string): boolean {
  return isAppHost(hostname, environment);
}

/** App subdomain and entire non-production deploys should not be indexed. */
export function shouldNoindex(hostname: string, environment: string): boolean {
  if (isAppHost(hostname, environment)) return true;
  if (!isProductionEnvironment(environment)) {
    return hostname === DEV_MARKETING_HOST || hostname === DEV_APP_HOST;
  }
  return false;
}
