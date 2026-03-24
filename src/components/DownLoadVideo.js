import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { AppImages } from '../assets/constant';
import { interstitial } from './Ads/adMethods';
import { useIsFocused } from '@react-navigation/native';
import { customWebTab } from './customWebTab';
import { trackScreenView } from '../helper/ScreenTracking';
const VideoCard = ({ title, type, downloadVideo }) => {
  const getIcon = () => {
    if (type === 'youtube') {
      return AppImages.youtubelogo;
    } else {
      return AppImages.instagram;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={getIcon()} style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={downloadVideo}>
        <Image source={AppImages.download} style={styles.downloadIcon} />
        <Text style={styles.btnText}>Download</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function DonwloadVideo() {
  const [loadShow, setLoadShow] = useState(true);
  const isFocused = useIsFocused();
  useEffect(() => {
    interstitial.load();
  }, [isFocused, loadShow]);
  const downloadVideo = async videoUrl => {
    try {
      setLoadShow(false);
      await trackScreenView('DownLoadVideos', 'AppReview');
      // customWebTab(videoUrl).then(async res => {
      //   await interstitial.show();
      //   setLoadShow(true);
      //   console.log('res', res);
      // });
      Linking.openURL(videoUrl);
      await interstitial.show();
      setLoadShow(true);
    } catch (error) {
      console.log('error', error);
      await trackScreenView('DownLoadVideos', 'AppReview');
      // customWebTab(videoUrl).then(async res => {
      // await interstitial.show();
      // setLoadShow(true);
      //   console.log('res', res);
      // });
      Linking.openURL(videoUrl);
      await interstitial.show();
      setLoadShow(true);
      await trackScreenView('DownLoadVideos', 'AppReview');
    }
  };
  return (
    <View style={styles.container}>
      {/* YouTube Card */}
      <VideoCard
        title="YouTube Video"
        type="youtube"
        downloadVideo={() =>
          downloadVideo('https://turboscribe.ai/downloader/youtube/video')
        }
      />

      {/* Instagram Card */}
      <VideoCard
        title="Instagram Reel"
        type="instagram"
        downloadVideo={() => downloadVideo('https://fastdl.app/en2')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  url: {
    fontSize: 12,
    color: '#555',
    marginBottom: 10,
  },
  btn: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
    marginRight: 5,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
