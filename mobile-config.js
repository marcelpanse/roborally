// http://docs.meteor.com/#/full/mobileconfigjs

// generate sizes --> http://ticons.fokkezb.nl/

// This section sets up some basic app metadata,
// the entire section is optional.
App.info({
  id: 'com.roborally',
  name: 'RoboRally',
  description: 'You are brilliant. You are powerful. You are sophisticated. You are BORED. Play RoboRally online!',
  author: 'Marcel Panse',
  email: 'info@roborally.com',
  website: 'http://www.roborally.com'
});

// Set up resources such as icons and launch screens.
App.icons({
  'iphone': 'public/iphone/appicon-60.png',
  'iphone_2x': 'public/iphone/appicon-60@2x.png',
  'iphone_3x': 'public/iphone/appicon-60@3x.png',
  'ipad': 'public/iphone/appicon-60.png',
  'ipad_2x': 'public/iphone/appicon-60@2x.png',
  'android_ldpi': 'public/android/drawable-ldpi/appicon.png',
  'android_mdpi': 'public/android/drawable-mdpi/appicon.png',
  'android_hdpi': 'public/android/drawable-hdpi/appicon.png',
  'android_xhdpi': 'public/android/drawable-xhdpi/appicon.png'
});

App.launchScreens({
  'iphone': 'public/iphone/Default-Landscape.png',
  'iphone_2x': 'public/iphone/Default-Landscape@2X.png',
  'iphone5': 'public/iphone/Default-Landscape-736h@3x.png',
  'iphone6': 'public/iphone/Default-Landscape-736h@3x.png',
  'iphone6p_landscape': 'public/iphone/Default-Landscape-736h@3x.png',
  'ipad_landscape': 'public/iphone/Default-Landscape-736h@3x.png',
  'ipad_landscape_2x': 'public/iphone/Default-Landscape-736h@3x.png',
  'android_ldpi_landscape': 'public/android/res-long-land-ldpi/default.png',
  'android_mdpi_landscape': 'public/android/res-long-land-mdpi/default.png',
  'android_hdpi_landscape': 'public/android/res-long-land-hdpi/default.png',
  'android_xhdpi_landscape': 'public/android/res-long-land-xhdpi/default.png'
});

// Set PhoneGap/Cordova preferences
App.setPreference('BackgroundColor', '0xffffffff');
App.setPreference('HideKeyboardFormAccessoryBar', true);
App.setPreference('Fullscreen', true);
App.setPreference('Orientation', "landscape");
