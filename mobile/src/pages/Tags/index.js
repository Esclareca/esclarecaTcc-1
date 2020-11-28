import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  AsyncStorage,
  Platform,
  FlatList,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import SectionedMultiSelect from 'react-native-sectioned-multi-select';

import styles from "./styles";
import { showError, showSucess } from "../../common";
import api from "../../services/api";
import { AuthContext } from "../../context";

export default function Tags({ route, navigation }) {
  const { singIn } = React.useContext(AuthContext);
  const [tags, setTags] = useState([]);
  const [selectedItems, setSelectedItems] = useState([])
  const [searchText, setSearchText] = useState("");
  const tempUser = route.params.user;
  const [avatarUser, setAvatarUser] = useState("");
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // try {
    //   if (tempUser.photoUrl) {
    //     setAvatarUser(tempUser.photoUrl);
    //   } else if (tempUser.picture.data.url) {
    //     setAvatarUser(tempUser.picture.data.url);
    //   }
    // } catch (e) {
    //   console.log(e);
    // }
  }, [route.params.user]);

  useEffect(() => {
    fetchTags()
    async function fetchTags() {
      await loadTags(1)
    }
  }, []);

  async function cadastrarTag() {
    await api.post('/tags', {
      name: searchText
    }).then(res => {
      loadTags(1)
    })
  }

  async function onSelectedItemsChange(sele) {
    setSelectedItems(sele);
  };
  async function onSearchChange(text) {
    if (text.length > 2) {
      loadTags(page)
    }
  }
  async function loadTags(pag) {
    if (loading) {
      return;
    }

    if (total > 0 && pag > 1 && tags.length >= total) {
      //Impede que faça a requisição caso a qtd máxima já tenha sido atingida
      return;
    }
    setLoading(true)
    await api.get('/tags', {
      headers: { search_text: searchText },
      params: { page: pag },
    }).then(t => {
      setPage(pag + 1)
      setTotal(t.headers["x-total-count"]);
      setTags([...tags, ...t.data])
      setLoading(false)
    })
  }

  async function handleSubmit() {
    try {
      const response = await api.post("/signup", {
        name: route.params.type == 'google' ? tempUser.displayName : tempUser.name,
        email: tempUser.email,
        password: '',
        tags,
        avatarUser: avatarUser,
        type: route.params.type,
        idGoogle: route.params.type == 'google' ? tempUser.uid : '',
        idFacebook: route.params.type == 'facebook' ? tempUser.id : ''
      });
      if (response.status == 204) {
        showSucess(`Bem-vindo ${route.params.type == 'google' ? tempUser.displayName : tempUser.name}!`);
        //navigation.goBack()
        try {
          const response = await api.post("/signin", {
            email: tempUser.email,
            password: '',
            type: route.params.type,
            idGoogle: route.params.type == 'google' ? tempUser.uid : '',
            idFacebook: route.params.type == 'facebook' ? tempUser.id : ''
          });
          const user = response.data;
          try {
            await AsyncStorage.setItem("token", user.token.toString());
            await AsyncStorage.setItem("user", user.id.toString());
            await AsyncStorage.setItem("userName", user.name.toString());
            await AsyncStorage.setItem("userTags", user.tags.toString());
            singIn();
          } catch (x) {
            showError(x);
          }
        } catch (e) {
          showError("Error:\n" + e);
        }
      } else {
        showError("Erro");
      }
    } catch (e) {
      showError(e);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS == "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={20} color="#FFC300"></Feather>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          onPress={handleSubmit}
        >
          <Text style={styles.label}>Finalizar</Text>
          <Feather
            name="chevron-right"
            size={20}
            style={{ top: 1, left: 2 }}
            color="#FFC300"
          ></Feather>
        </TouchableOpacity>
      </View>
      <View style={styles.forms}>
        <Text style={styles.label1}>Feeds com a sua cara!</Text>
        <Text style={styles.label1}>Escolha os assuntos de seu interesse:</Text>
        <SectionedMultiSelect
          items={tags}
          IconRenderer={MaterialIcons}
          uniqueKey="_id"
          selectText="Escolha alguns assuntos..."
          confirmText={"Confirmar"}
          searchPlaceholderText={"Escolha alguns assuntos para seguir"}
          searchAdornment={s => { setSearchText(s); onSearchChange(s) }}
          noResultsComponent={
            <View>
              <Text>Nenhum item encontrado</Text>
              <TouchableOpacity onPress={() => cadastrarTag()} style={styles.button}>
                <Text style={styles.label2}>Cadastrar Tag</Text>
              </TouchableOpacity>
            </View>
          }
          onSelectedItemsChange={(sel) => onSelectedItemsChange(sel)}
          selectedItems={selectedItems}
          loading={loading}
          itemsFlatListProps={{ initialNumToRender: 10, onEndReached: () => { loadTags(page) }, onEndReachedThreshold: 0.2 }}
        />
      </View>

    </KeyboardAvoidingView>

  );
}
