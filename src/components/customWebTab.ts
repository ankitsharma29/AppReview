import { Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import Colors from '../resource/theme/color';

export const customWebTab = async (webUrl?: string) => {
  try {
    const url = 'https://cracknaukri.in';

    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.open(webUrl, {
        // iOS Properties
        dismissButtonStyle: 'close',
        preferredBarTintColor: Colors.black(),
        preferredControlTintColor: 'white',
        readerMode: false,
        animated: false,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,
        // Android Properties
        showTitle: false,
        toolbarColor: Colors.black(),
        secondaryToolbarColor: 'black',
        navigationBarColor: 'black',
        navigationBarDividerColor: 'white',
        enableUrlBarHiding: false,
        enableDefaultShare: false,
        forceCloseOnRedirection: false,
        // Specify full animation resource identifier(package:anim/name)
        // or only resource name(in case of animation bundled with app).
        animations: {
          startEnter: 'slide_in_right',
          startExit: 'slide_out_left',
          endEnter: 'slide_in_left',
          endExit: 'slide_out_right',
        },
        headers: {
          'my-custom-header': 'my custom header value',
        },
      });
      return result;
    } else Linking.openURL(url);
  } catch (error: any) {
    // console.error(error.message);
  }
};
