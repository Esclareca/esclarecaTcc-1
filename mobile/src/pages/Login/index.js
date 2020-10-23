import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import {
  View,
  AsyncStorage,
  KeyboardAvoidingView,
  Text,
  Platform,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import api from "../../services/api";

import logo from "../../assets/icon.png"; // Nessa página poderia usar uma logo maior
import styles from "./styles";
import * as Animatable from "react-native-animatable";

import { AuthContext } from "../../context";

import { showError } from "../../common";

export default function Login() {
  const navigation = useNavigation();
  const { singIn } = React.useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("user").then((user) => {
      if (user) {
        navigation.navigate("Home");
      }
    });
  }, []);
  //Inserir tratamento para caso tente inserir vazio
  async function handleSubmit() {
    if (email != "" && senha != "") {
      try {
        const response = await api.post("/signin", {
          email,
          password: senha,
          type: 'app'
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
        showError(e);
      }
    } else {
      showError("Preencha os campos email e senha.");
    }
  }

  async function navigateToRegister() {
    navigation.navigate("Register");
  }

  async function navigateToPassword() {
    navigation.navigate("Password");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({
        ios: 'padding',
        android: null,
      })}
      style={styles.container}>
      <StatusBar barStyle="light-content" translucent={false} backgroundColor={'#365478'} />
      <View style={styles.header}>
        <Animatable.Image
          animation="fadeInUpBig"
          duration={0}
          source={logo}
          style={styles.img}
          resizeMode="stretch"
        />
      </View>
      <Animatable.View
        style={styles.form}
        animation="fadeInUpBig">
        <Text style={styles.text}>Entre com sua conta</Text>
        <Text style={styles.label}>E-MAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu e-mail"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          returnKeyType={"next"}
          onSubmitEditing={() => { this.secondTextInput.focus(); }}
          blurOnSubmit={false}
        />
        <Text style={styles.label}>SENHA</Text>
        <TextInput
          style={styles.input2}
          placeholder="Sua senha"
          placeholderTextColor="#999"
          secureTextEntry={true}
          password={true}
          autoCapitalize="words"
          autoCorrect={false}
          value={senha}
          onChangeText={setSenha}
          returnKeyType="done"
          onSubmitEditing={() => { handleSubmit() }}
          blurOnSubmit={false}
          ref={(input) => { this.secondTextInput = input; }}
        />
        <TouchableOpacity onPress={navigateToPassword} style={{ marginBottom: 0 }}>
          <Text style={{ color: '#e8423f', fontWeight: 'bold' }}>Esqueci a senha</Text>
        </TouchableOpacity>

        <View style={styles.btn}>
          <TouchableOpacity onPress={handleSubmit} style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
            <Feather
              style={{ top: 1, left: 10 }}
              name="chevron-right"
              size={20}
              color="#FFC300"
            ></Feather>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToRegister} style={styles.button2}>
            <Text style={styles.buttonText2}>Não possui registro?</Text>
            <Text style={styles.buttonText2}>Cadastre-se aqui!</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </KeyboardAvoidingView>
  );
}
