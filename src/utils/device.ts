import type { DeviceInfo } from '../types/signaling';

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let type: DeviceInfo['type'] = 'desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  // Detect OS
  if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'iOS';
    type = /iPad/.test(ua) ? 'tablet' : 'mobile';
  } else if (/Android/.test(ua)) {
    os = 'Android';
    type = /Tablet|iPad/.test(ua) ? 'tablet' : 'mobile';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS';
    type = 'desktop';
  } else if (/Windows NT/.test(ua)) {
    os = 'Windows';
    type = 'desktop';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
    type = 'desktop';
  }

  // Detect Browser
  if (/Edg\//.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//.test(ua)) {
    browser = 'Firefox';
  }

  // Friendly Device Name
  let name = `${os} Device`;
  if (type === 'mobile') {
    name = os === 'iOS' ? 'iPhone' : 'Android Phone';
  } else if (type === 'tablet') {
    name = os === 'iOS' ? 'iPad' : 'Android Tablet';
  } else if (os === 'macOS') {
    name = 'Mac';
  } else if (os === 'Windows') {
    name = 'Windows PC';
  }

  return {
    name,
    type,
    browser,
    os,
  };
}
