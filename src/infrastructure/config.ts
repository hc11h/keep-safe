interface Config {
    server: {
        port: number;
        nodeEnv: string;
    };
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
}

function getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
}

function getOptionalNumberEnvVar(name: string, defaultValue: number): number {
    const value = process.env[name];
    if (!value) return defaultValue;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid environment variable ${name}: must be a number`);
    }
    return parsed;
}

export const config: Config = {
    server: {
        port: getOptionalNumberEnvVar('PORT', 3000),
        nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),
    },
    database: {
        url: getRequiredEnvVar('DATABASE_URL'),
    },
    jwt: {
        secret: getRequiredEnvVar('JWT_SECRET'),
        expiresIn: getOptionalEnvVar('JWT_EXPIRES_IN', '24h'),
    },
};


export default config;
