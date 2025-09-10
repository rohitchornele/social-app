import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

export const storage = {
  // Token methods
  async setTokens(accessToken, refreshToken) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
  },

  async getAccessToken() {
    return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken() {
    return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async removeTokens() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  },

  // User data methods
  async setUserData(userData) {
    await SecureStore.setItemAsync(KEYS.USER_DATA, JSON.stringify(userData));
  },

  async getUserData() {
    const userData = await SecureStore.getItemAsync(KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  async removeUserData() {
    await SecureStore.deleteItemAsync(KEYS.USER_DATA);
  },

  // Clear all data
  async clearAll() {
    await this.removeTokens();
    await this.removeUserData();
  }
};
