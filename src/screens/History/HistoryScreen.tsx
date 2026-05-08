import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ToastAndroid,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorageServices from '../../helper/asyncStorageServices';
import Colors from '../../resource/theme/color';
import Header from '../../components/Header';
import { Copy, Delete } from '../../assets/constant';
import Fonts from '../../resource/theme/font';
import { interstitial } from '../../components/Ads/adMethods';
import { useIsFocused } from '@react-navigation/native';

const HistoryScreen = ({ navigation }: any) => {
  const [history, setHistory] = useState([]);
  const isFocused = useIsFocused();
  useEffect(() => {
    interstitial.load();
  }, [isFocused]);

  useEffect(() => {
    try {
      setTimeout(() => {
        if (isFocused == true) {
          (async () => {
            await interstitial.show();
          })();
        }
      }, 5000);
    } catch (error) {}
  }, [isFocused]);
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await AsyncStorageServices.getItem('urlHistory');
    if (data) {
      setHistory(JSON.parse(data));
    }
  };

  const deleteItem = async index => {
    let newHistory = [...history];
    newHistory.splice(index, 1);

    setHistory(newHistory);
    await AsyncStorageServices.setItem(
      'urlHistory',
      JSON.stringify(newHistory),
    );
    ToastAndroid.showWithGravity(
      'deleted item',
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
    );
  };

  const clearHistory = async () => {
    Alert.alert('Clear History', 'Are you sure?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          await AsyncStorageServices.removeItem('urlHistory');
          setHistory([]);
        },
      },
    ]);
  };

  const copyUrl = url => {
    Clipboard.setString(url);
    // Alert.alert('Copied', 'URL copied to clipboard');
    ToastAndroid.showWithGravity(
      'URL Copied',
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <Text style={styles.url} numberOfLines={1}>
        {index + 1}. {item}
      </Text>
      <View style={styles.row}>
        <TouchableOpacity
          // style={styles.copyBtn}
          onPress={() => copyUrl(item)}
        >
          <Copy fill={Colors.white()} />
        </TouchableOpacity>

        <TouchableOpacity
          // style={styles.deleteBtn}
          onPress={() => deleteItem(index)}
        >
          <Delete fill={Colors.white()} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={'History'} navigation={navigation} />

      <FlatList
        data={history}
        style={{ marginTop: 10, marginHorizontal: 10 }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No History Found</Text>}
      />
      {history.length > 0 && (
        <TouchableOpacity
          onPress={clearHistory}
          style={{
            alignItems: 'center',
          }}
        >
          <Text style={styles.clear}>Clear All History</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white(),
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  clear: {
    color: 'red',
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: Colors.lightWhite2(),
    padding: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },

  url: {
    fontSize: 18,
    marginBottom: 10,
    flex: 0.9,
    fontFamily: Fonts.poppinsRegular,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  copyBtn: {
    backgroundColor: Colors.green(),
    padding: 8,
    borderRadius: 5,
  },

  deleteBtn: {
    // backgroundColor: Colors.red(),
    padding: 8,
    borderRadius: 5,
  },

  btnText: {
    color: Colors.white(),
    fontWeight: 'bold',
  },

  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});
