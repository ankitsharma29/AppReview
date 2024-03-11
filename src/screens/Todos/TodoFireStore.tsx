import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const TodoFireStore = () => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot(querySnapshot => {
        const users = [];
        console.log("querySnapshot",querySnapshot);
        
        querySnapshot.forEach(documentSnapshot => {
          users.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data()
          });
        });
        setUsers(users);
      });

    return () => unsubscribe();
  }, []);

  const addUser = async () => {
    try {
      await firestore().collection('users').add({
        name: name,
        email: email,
        age: parseInt(age)
      });
      console.log('User added successfully!');
      setName('');
      setEmail('');
      setAge('');
    } catch (error) {
      console.error('Error adding user: ', error);
    }
  }

  const deleteUser = async (userId) => {
    try {
      await firestore().collection('users').doc(userId).delete();
      console.log('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user: ', error);
    }
  }

  const updateUser = async (userId) => {
    try {
      await firestore().collection('users').doc(userId).update({
        name: name,
        email: email,
        age: parseInt(age)
      });
      console.log('User updated successfully!');
      setName('');
      setEmail('');
      setAge('');
      setEditingUserId(null);
    } catch (error) {
      console.error('Error updating user: ', error);
    }
  }

  const startEditingUser = (user) => {
    setName(user.name);
    setEmail(user.email);
    setAge(user.age.toString());
    setEditingUserId(user.id);
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Users:</Text>
      {users.map(user => (
        <View key={user.id} style={{ flexDirection: 'row', marginVertical: 5 }}>
          <Text>{user.name}, {user.email}, {user.age}</Text>
          <Button title="Edit" onPress={() => startEditingUser(user)} />
          <Button title="Delete" onPress={() => deleteUser(user.id)} />
        </View>
      ))}
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={text => setName(text)}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={text => setEmail(text)}
      />
      <TextInput
        placeholder="Age"
        value={age}
        onChangeText={text => setAge(text)}
        keyboardType="numeric"
      />
      {editingUserId ? (
        <Button title="Update User" onPress={() => updateUser(editingUserId)} />
      ) : (
        <Button title="Add User" onPress={addUser} />
      )}
    </View>
  );
}

export default TodoFireStore;
