// src/utils/permissions.ts
import {Platform, Alert, Linking} from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
  openSettings,
} from 'react-native-permissions';

// ─────────────────────────────────────────────────────────────────
// Returns the correct permission for reading photos based on OS + version
// ─────────────────────────────────────────────────────────────────
function getPhotoReadPermission(): Permission {
  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.PHOTO_LIBRARY;
  }
  // Android 13+ (API 33+) uses READ_MEDIA_IMAGES
  if (Platform.Version >= 33) {
    return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
  }
  // Android 12 and below uses READ_EXTERNAL_STORAGE
  return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
}

// Returns the correct write permission (only needed below Android 10)
function getWritePermission(): Permission | null {
  if (Platform.OS === 'ios') return null; // iOS doesn't need write permission for Documents dir
  if (Platform.Version < 29) {
    return PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
  }
  return null; // Android 10+ scoped storage — no write permission needed
}

// ─────────────────────────────────────────────────────────────────
// Request photo library read permission
// Returns true if granted
// ─────────────────────────────────────────────────────────────────
export async function requestPhotoPermission(): Promise<boolean> {
  const permission = getPhotoReadPermission();

  try {
    const status = await check(permission);

    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return true;
    }

    if (status === RESULTS.DENIED) {
      const result = await request(permission);
      return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
    }

    if (status === RESULTS.BLOCKED) {
      showSettingsAlert(
        'Photo Access Blocked',
        'Photo library access has been denied. Please enable it in Settings to pick images.',
      );
      return false;
    }

    if (status === RESULTS.UNAVAILABLE) {
      Alert.alert('Not Available', 'Photo library is not available on this device.');
      return false;
    }

    return false;
  } catch (err) {
    console.error('requestPhotoPermission error:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Request write / storage permission (only on Android < 10)
// Returns true if granted or not needed
// ─────────────────────────────────────────────────────────────────
export async function requestWritePermission(): Promise<boolean> {
  const permission = getWritePermission();

  // Not needed — always granted
  if (!permission) return true;

  try {
    const status = await check(permission);

    if (status === RESULTS.GRANTED) return true;

    if (status === RESULTS.DENIED) {
      const result = await request(permission);
      return result === RESULTS.GRANTED;
    }

    if (status === RESULTS.BLOCKED) {
      showSettingsAlert(
        'Storage Access Blocked',
        'Storage access has been blocked. Please enable it in Settings to save files.',
      );
      return false;
    }

    return false;
  } catch (err) {
    console.error('requestWritePermission error:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Check + request both read AND write at once
// Returns { canRead, canWrite }
// ─────────────────────────────────────────────────────────────────
export async function requestAllPermissions(): Promise<{
  canRead: boolean;
  canWrite: boolean;
}> {
  const canRead = await requestPhotoPermission();
  const canWrite = await requestWritePermission();
  return {canRead, canWrite};
}

// ─────────────────────────────────────────────────────────────────
// Show an alert directing user to settings
// ─────────────────────────────────────────────────────────────────
function showSettingsAlert(title: string, message: string) {
  Alert.alert(title, message, [
    {text: 'Cancel', style: 'cancel'},
    {
      text: 'Open Settings',
      onPress: () => {
        openSettings().catch(() => Linking.openSettings());
      },
    },
  ]);
}