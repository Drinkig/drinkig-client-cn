import * as Keychain from 'react-native-keychain';

export const setTokens = async (accessToken: string, refreshToken: string) => {
    try {
        await Keychain.setGenericPassword('tokens', JSON.stringify({ accessToken, refreshToken }));
    } catch (error) {
        console.error('Secure Storage Error: Could not save tokens', error);
    }
};

export const getAccessToken = async (): Promise<string | null> => {
    try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
            const tokens = JSON.parse(credentials.password);
            return tokens.accessToken;
        }
    } catch (error) {
        console.error('Secure Storage Error: Could not retrieve access token', error);
    }
    return null;
};

export const getRefreshToken = async (): Promise<string | null> => {
    try {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
            const tokens = JSON.parse(credentials.password);
            return tokens.refreshToken;
        }
    } catch (error) {
        console.error('Secure Storage Error: Could not retrieve refresh token', error);
    }
    return null;
};

export const clearTokens = async () => {
    try {
        await Keychain.resetGenericPassword();
    } catch (error) {
        console.error('Secure Storage Error: Could not clear tokens', error);
    }
};
