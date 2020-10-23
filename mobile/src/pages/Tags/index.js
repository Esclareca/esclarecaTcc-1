import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  AsyncStorage,
  TextInput,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import styles from "./styles";
import { showError, showSucess } from "../../common";
import api from "../../services/api";
import { AuthContext } from "../../context";

export default function Tags({ route, navigation }) {
  const { singIn } = React.useContext(AuthContext);
  const [tags, setTags] = useState("");
  const tempUser = route.params.user;
  const [avatarUser, setAvatarUser] = useState("");

  useEffect(() => {
    try {
      if (tempUser.photoUrl) {
        setAvatarUser(tempUser.photoUrl);
      } else {
        setAvatarUser(tempUser.picture.data.url);
      }
    } catch (e) {
      console.log(e);
    }
  }, [route.params.user]);

  async function handleSubmit() {
    try {
      const response = await api.post("/signup", {
        name: tempUser.name,
        email: tempUser.email,
        password: '',
        tags,
        avatarUser: avatarUser,
        type: route.params.type,
        idGoogle: route.params.type == 'google' ? tempUser.id : '',
        idFacebook: route.params.type == 'facebook' ? tempUser.id : ''
      });
      if (response.status == 204) {
        showSucess(`Bem-vindo ${tempUser.name}!`);
        //navigation.goBack()
        try {
          const response = await api.post("/signin", {
            email: tempUser.email,
            password: tempUser.id,
            type: route.params.type,
            idGoogle: route.params.type == 'google' ? tempUser.id : '',
            idFacebook: route.params.type == 'facebook' ? tempUser.id : ''
          });
          const user = response.data;
          try {
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: "white",
              fontSize: 20,
              marginRight: 5,
            }}
          >
            Quase lá...
          </Text>
        </View>
      </View>
      <View style={styles.forms}>
        <Text style={styles.label1}>Feeds com a sua cara!</Text>
        <Text style={styles.label1}>Digite os assuntos de seu interesse:</Text>
        <TextInput
          style={styles.input}
          placeholder="Assuntos separados por ' , '"
          placeholderTextColor="#999"
          autoCapitalize="words"
          autoCorrect={false}
          multiline={true}
          numberOfLines={7}
          value={tags}
          onChangeText={setTags}
          returnKeyType="done"
          onSubmitEditing={() => {
            handleSubmit();
          }}
          blurOnSubmit={false}
        />
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
    </KeyboardAvoidingView>
  );
}
