import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  ListRenderItem,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ShadowRadiusView from '../../components/ShadowRadiusView';

import { customWebTab } from '../../components/customWebTab';
import Mixins from '../../resource/mixins/appStyle';
import Fonts from '../../resource/theme/font';
import Colors from '../../resource/theme/color';
import { Image } from 'react-native';
import { RefreshControl } from 'react-native';
import { getDeviceId } from '../../helper/appUtils';
import { adsData } from './adsData';
import { AppImages } from '../../assets/constant';

type AdsListProps = NativeStackScreenProps<any, 'AdsList'>;
const { scaleSize, scaleFont } = Mixins;

const AdsList = ({ navigation }: AdsListProps) => {
  const [dimensions, setDimensions] = useState<any>({ width: 0, height: 0 });
  const [adsListData, setAdsListData] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchGameData();
  }, []);
  console.log('adsData', adsData);
  // fetch game list data
  const fetchGameData = async () => {
    try {
      setAdsListData(adsData?.data);
    } catch (error) {
      // console.log('error');
    }
  };

  const keyExtractor = (_item: any, index: number) => `ListItem_${index}`;

  const ItemSeparatorComponent = (_item: any, _index: number) => (
    <View style={styles.separator} />
  );

  const renderListItem: ListRenderItem<any> = ({ item }) => (
    <>
      <TouchableOpacity
        onPress={() => {
          Linking.openURL(item?.channelUrl);
        }}
      >
        <ShadowRadiusView style={styles.listItem}>
          <Image
            style={styles.image}
            source={
              item?.platform == 'youtube'
                ? AppImages.youtubelogo
                : AppImages.instagram
            }
            resizeMode="contain"
          />
          <Text numberOfLines={2} style={styles.title}>
            {item?.name}
          </Text>
          <Text numberOfLines={2} style={styles.subtitle}>
            {item?.channelName}
          </Text>
          {/* <Text style={styles.Rating}>{`Rating: ${item?.rating}`}</Text>
          <Text style={styles.Rating}>{`GamePlays:${item?.gamePlays}`}</Text> */}
        </ShadowRadiusView>
      </TouchableOpacity>
    </>
  );

  const onListLayout = event => {
    if (dimensions.width === 0 && dimensions.height === 0) {
      setDimensions({
        width: event.nativeEvent.layout.width,
        height: event.nativeEvent.layout.height,
      });
    }
  };

  const styles = getStyles(dimensions.width);

  const ListEmptyComponent = () => (
    <ShadowRadiusView style={styles.noListView}>
      <View style={styles.noTransactionView}>
        <Text style={styles.noTransactionTxt}>searching...</Text>
      </View>
    </ShadowRadiusView>
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // console.log('refreshing', refreshing);
    fetchGameData();
    setRefreshing(false);
  }, []);



  return (
    <FlatList
      data={adsListData ?? []}
      numColumns={2}
      contentContainerStyle={styles.listContainerStyle}
      renderItem={renderListItem}
      keyExtractor={keyExtractor}
      onLayout={onListLayout}
      ItemSeparatorComponent={ItemSeparatorComponent}
      onEndReachedThreshold={0.2}
      // ListEmptyComponent={ListEmptyComponent}
      // showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

export default AdsList;

const getStyles = (listWidth: number) =>
  StyleSheet.create({
    container: {},
    listContainerStyle: {
      paddingVertical: scaleSize(30),
    },
    listItem: {
      marginHorizontal: scaleSize(5),
      width: (listWidth - 4 * scaleSize(5)) / 2,
    },
    separator: {
      height: scaleSize(10),
    },
    noListView: {
      padding: scaleSize(20),
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: scaleSize(150),
      height: scaleSize(120),
      borderRadius: scaleSize(8),
    },
    title: {
      marginTop: scaleSize(5),
      fontFamily: Fonts.poppinsBold,
      fontSize: scaleFont(20),
      color: Colors.white(),
      fontWeight: 'bold',
    },
    subtitle: {
      fontFamily: Fonts.poppinsRegular,
      fontSize: scaleFont(16),
      color: Colors.white(),
    },
    GameRating: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    Rating: {
      fontFamily: Fonts.poppinsMedium,
      fontSize: Mixins.scaleFont(16),
      color: Colors.white(),
    },
    noTransactionView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: scaleSize(20),
    },
    noTransactionTxt: {
      marginTop: scaleSize(35),
      fontSize: scaleFont(18),
      fontFamily: Fonts.poppinsMedium,
      color: Colors.white(),
    },
  });
