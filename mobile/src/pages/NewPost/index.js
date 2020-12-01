import React, { useState } from 'react';

import { SafeAreaView, View, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Feather } from "@expo/vector-icons"
import Tag_Select from "../../Components/Tag_Select";

import api from '../../services/api'

import styles from './styles'

import { showError, showSucess } from '../../common'

export default function NewPost({ route, navigation }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const type = route.params.type
  const [selectedItems, setSelectedItems] = useState([])
  async function onSelectedItemsChange(sele) {
    setSelectedItems(sele);
  };

  async function handleSubmit() {
    try {
      const post = await api.post(`/posts`, {
        title, desc, tags: selectedItems
      }, {
        headers: { type }
      })
      if (post.status == 201) {
        showSucess(`${type == false ? 'Dúvida' : 'Conteúdo'} cadastrad${type == false ? 'a' : 'o'} com sucesso`)
        navigateToPost(post.data)
      } else {
        showError("Ocorreu um erro")
      }
    }
    catch (e) {
      showError(e)
    }
  }

  function navigateToPost(post) {
    navigation.navigate("PostPage", {
      post,
    });
  }
  function handleCancel() {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Feather name="chevron-left" size={24} color="#FFC300"></Feather>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 20 }}>Postar {type == false ? 'dúvida' : 'conteúdo'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={{ paddingHorizontal: 30, marginTop: 40 }}>
          <Text style={styles.label}>Título d{type == false ? 'a dúvida' : 'o conteúdo'}</Text>
          <TextInput
            autoFocus={true}
            style={styles.input}
            placeholder={"Título que deseja dar " + (type == false ? "à sua dúvida" : "ao seu conteúdo")}
            placeholderTextColor="#999"
            autoCapitalize="words"
            autoCorrect={false}
            value={title}
            onChangeText={setTitle}
            numberOfLines={2}
            returnKeyType={"next"}
            onSubmitEditing={() => { this.secondTextInput.focus(); }}
            blurOnSubmit={false}
          />
          <Text style={styles.label}>Descrição d{type == false ? 'a dúvida' : 'o conteúdo'}</Text>
          <TextInput
            style={styles.inputContainer}
            multiline={true}
            numberOfLines={4}
            placeholder={"Descreva " + (type == false ? "qual à sua dúvida" : "seu conteúdo")}
            value={desc}
            onChangeText={setDesc}
            returnKeyType={"next"}
            // onSubmitEditing={() => { this.thirdTextInput.focus(); }}
            blurOnSubmit={false}
            ref={(input) => { this.secondTextInput = input; }}
          />
          <Text style={styles.label}>Tags</Text>
          <Tag_Select selectedItems={selectedItems} onSelectedItemsChange={onSelectedItemsChange} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
