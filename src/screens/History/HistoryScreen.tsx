import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorageServices from '../../helper/asyncStorageServices';
import Colors from '../../resource/theme/color';
import Header from '../../components/Header';

const HistoryScreen = ({ navigation }: any) => {
  const [history, setHistory] = useState([]);

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
    Alert.alert('Copied', 'URL copied to clipboard');
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <Text style={styles.url}>{item}</Text>

      <View style={styles.row}>
        <TouchableOpacity style={styles.copyBtn} onPress={() => copyUrl(item)}>
          <Text style={styles.btnText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteItem(index)}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={'History'} navigation={navigation} historyButton={false} />

      <FlatList
        data={history}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No History Found</Text>}
      />
      {/* {history.length > 0 && (
        <TouchableOpacity
          onPress={clearHistory}
          style={{
            padding: scaleSize(10),
            backgroundColor: Colors.black(),
            alignItems: 'center',
            borderRadius: 5,
          }}
        >
          <Text style={styles.clear}>Clear All</Text>
        </TouchableOpacity> */}
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
    backgroundColor: Colors.lightWhite(),
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },

  url: {
    fontSize: 14,
    marginBottom: 10,
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
    backgroundColor: Colors.red(),
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
