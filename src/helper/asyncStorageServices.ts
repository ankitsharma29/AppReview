import AsyncStorage from '@react-native-async-storage/async-storage';

export default class AsyncStorageServices {
  static setItem(key: string, value: any) {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }
  
  static getItem(key: string) {
    return AsyncStorage.getItem(key).then((item: any) => {
      return JSON.parse(item);
    });
  }

  static removeItem(key: string) {
    return AsyncStorage.removeItem(key);
  }

  static removeAll() {
    return AsyncStorage.clear();
  }

  static getAllKeys() {
    return AsyncStorage.getAllKeys();
  }
}
