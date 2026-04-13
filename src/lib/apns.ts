import apn from 'apn';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

let providerProduction: apn.Provider | null = null;
let providerSandbox: apn.Provider | null = null;

function normalizeInlinePrivateKey(value: string): string {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;
  return unquoted.replace(/\\n/g, '\n');
}

function createProvider(production: boolean): apn.Provider {
  const teamId = requireEnv('APNS_TEAM_ID');
  const keyId = requireEnv('APNS_KEY_ID');
  const p8Raw = process.env.APNS_P8_KEY;
  const p8Path = process.env.APNS_P8_KEY_PATH;
  const p8 = p8Raw ? normalizeInlinePrivateKey(p8Raw) : undefined;

  if (!p8 && !p8Path) {
    throw new Error('Missing APNS_P8_KEY or APNS_P8_KEY_PATH');
  }

  return new apn.Provider({
    token: {
      key: p8 ?? p8Path!,
      keyId,
      teamId,
    },
    production,
  });
}

export function getApnsProvider(production: boolean): apn.Provider {
  if (production) {
    if (!providerProduction) providerProduction = createProvider(true);
    return providerProduction;
  }
  if (!providerSandbox) providerSandbox = createProvider(false);
  return providerSandbox;
}

export function getApnsTopic(): string {
  return requireEnv('APNS_BUNDLE_ID');
}

/** True when Team ID, Key ID, Bundle ID, and .p8 (or path) are present. */
export function isApnsConfigured(): boolean {
  try {
    if (!process.env.APNS_TEAM_ID || !process.env.APNS_KEY_ID || !process.env.APNS_BUNDLE_ID) {
      return false;
    }
    return Boolean(process.env.APNS_P8_KEY || process.env.APNS_P8_KEY_PATH);
  } catch {
    return false;
  }
}
