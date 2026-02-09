type Env = Record<string, string | undefined>;

export function validateEnv(config: Env): Env {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const expiresIn = config.JWT_EXPIRES_IN ?? '15m';
  const validExpiresIn = /^\d+(ms|s|m|h|d)$/.test(expiresIn);

  for (const key of required) {
    if (!config[key] || config[key].trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  if (!validExpiresIn) {
    throw new Error(
      'Invalid JWT_EXPIRES_IN. Use formats like 30s, 15m, 1h, 7d, or 500ms.',
    );
  }

  return {
    ...config,
    JWT_EXPIRES_IN: expiresIn,
  };
}
