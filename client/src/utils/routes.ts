import {

  DEV_APP_HOST,

  DEV_MARKETING_HOST,

  PROD_APP_HOST,

  PROD_MARKETING_HOST,

  appHostForEnvironment,

  appOriginForEnvironment,

  appOriginForHostname,

  marketingHostForEnvironment,

  marketingOriginForEnvironment,

  marketingOriginForHostname,

  SHIFTS,

  todayInClinic,

} from '@dialyrounds/shared';



export {

  DEV_APP_HOST,

  DEV_MARKETING_HOST,

  PROD_APP_HOST,

  PROD_MARKETING_HOST,

} from '@dialyrounds/shared';



type DeployEnv = 'development' | 'production';



const APP_PATH_PREFIXES = [

  '/login',

  '/patients',

  '/attest',

  '/import',

  '/reports',

  '/admin',

];



const MARKETING_PATHS = new Set(['/', '/security', '/privacy']);



function bakedDeployEnv(): DeployEnv | null {

  const value = import.meta.env.VITE_DEPLOY_ENV;

  if (value === 'development' || value === 'production') return value;

  return null;

}



function isLocalHost(hostname: string): boolean {

  return hostname === 'localhost' || hostname === '127.0.0.1';

}



export function isAppHost(hostname = window.location.hostname): boolean {

  const mode = import.meta.env.VITE_SITE_MODE;

  if (mode === 'marketing') return false;

  if (mode === 'app') return true;

  if (isLocalHost(hostname)) return true;



  const deploy = bakedDeployEnv();

  if (deploy) return hostname === appHostForEnvironment(deploy);



  return hostname === PROD_APP_HOST || hostname === DEV_APP_HOST;

}



export function isMarketingHost(hostname = window.location.hostname): boolean {

  const mode = import.meta.env.VITE_SITE_MODE;

  if (mode === 'marketing') return true;

  if (mode === 'app') return false;



  const deploy = bakedDeployEnv();

  if (deploy) {

    if (hostname === 'www.dialyrounds.com') return deploy === 'production';

    return hostname === marketingHostForEnvironment(deploy);

  }



  return (

    hostname === PROD_MARKETING_HOST ||

    hostname === DEV_MARKETING_HOST ||

    hostname === 'www.dialyrounds.com'

  );

}



export function isAppPath(pathname: string): boolean {

  return APP_PATH_PREFIXES.some(

    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)

  );

}



export function isMarketingPath(pathname: string): boolean {

  return MARKETING_PATHS.has(pathname);

}



export function appOrigin(): string {

  const hostname = window.location.hostname;

  if (import.meta.env.DEV || isLocalHost(hostname)) return window.location.origin;



  const deploy = bakedDeployEnv();

  if (deploy) return appOriginForEnvironment(deploy);



  return appOriginForHostname(hostname);

}



export function marketingOrigin(): string {

  const hostname = window.location.hostname;

  if (import.meta.env.DEV || isLocalHost(hostname)) return window.location.origin;



  const deploy = bakedDeployEnv();

  if (deploy) return marketingOriginForEnvironment(deploy);



  return marketingOriginForHostname(hostname);

}



export function postLoginPath(): string {
  return patientsListUrl({ shift: SHIFTS[0], status: 'active', date: todayInClinic() });
}

export function appLoginHref(returnTo?: string): string {

  const url = new URL('/login', appOrigin());

  if (returnTo) url.searchParams.set('returnTo', returnTo);

  return url.toString();

}



export function marketingHref(path: string): string {

  return `${marketingOrigin()}${path.startsWith('/') ? path : `/${path}`}`;

}



export interface PatientListFilters {

  unitId?: string;

  shift: string;

  status: string;

  date: string;

  msg?: string;

}



export function patientsListUrl(filters: PatientListFilters): string {

  const params = new URLSearchParams();

  if (filters.unitId) params.set('unit', filters.unitId);

  params.set('shift', filters.shift);

  params.set('status', filters.status);

  params.set('date', filters.date);

  if (filters.msg) params.set('msg', filters.msg);

  const query = params.toString();

  return query ? `/patients?${query}` : '/patients';

}



export function legacyListRedirect(pathname: string, search: string): string | null {

  if (pathname !== '/') return null;

  const suffix = search.startsWith('?') ? search : search ? `?${search}` : '';

  return `/patients${suffix}`;

}


