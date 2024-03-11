import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert } from 'react-native';
import database from '@react-native-firebase/database';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [todoText, setTodoText] = useState('');

  useEffect(() => {
    const todoRef = database().ref('/todos');
    todoRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const todoItems = Object.values(data);
        setTodos(todoItems);
      }
    });

    return () => todoRef.off('value');
  }, []);

  const addTodo = () => {
    if (todoText) {
      const newTodoRef = database().ref('/todos').push();
      newTodoRef.set({
        id: newTodoRef.key,
        text: todoText,
        completed: false,
      });
      setTodoText('');
    }
  };

  const updateTodo = (id, newText) => {
    database().ref(`/todos/${id}`).update({
      text: newText,
    });
  };

  const deleteTodo = id => {
    Alert.alert(
      'Delete Todo',
      'Are you sure you want to delete this todo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            database().ref(`/todos/${id}`).remove();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderItem = ({ item }) => (
    <View>
      <Text>{item.text}</Text>
      <TextInput
        value={item.text}
        onChangeText={newText => updateTodo(item.id, newText)}
      />
      <Button title="Delete" onPress={() => deleteTodo(item.id)} />
    </View>
  );

  return (
    <View>
      <TextInput
        placeholder="Enter todo"
        value={todoText}
        onChangeText={text => setTodoText(text)}
      />
      <Button title="Add Todo" onPress={addTodo} />
      <FlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

export default TodoApp;
