import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

import {
  Image,
  View,
  AsyncStorage,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import api from "../../services/api";
import Constants from "expo-constants";
import logo from "../../assets/logo.png"; // Nessa página poderia usar uma logo maior
import facebookIcon from "../../assets/facebook.png";
import googleIcon from "../../assets/google.png";
import styles from "./styles";
import * as Animatable from "react-native-animatable";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as Facebook from "expo-facebook";
// import * as Google from "expo-google-app-auth";
import * as GoogleSignIn from 'expo-google-sign-in';
import { AuthContext } from "../../context";
import UserPermission from "../../UserPermissions";

export default function Init() {
  const navigation = useNavigation();
  const { singIn } = React.useContext(AuthContext);

  async function navigateToLogin() {
    navigation.navigate("Login");
  }

  async function navigateToTags(user, type) {
    navigation.navigate("Tags", {
      user, type
    });
  }

  useEffect(() => {
    AsyncStorage.getItem("user").then((user) => {
      if (user) {
        navigation.navigate("Home");
      }
    });
    UserPermission.getCameraPermission();
    Constants.isDevice == true
      ? UserPermission.registerForPushNotifications()
      : null;
    loadGoogleSignIn()
    async function loadGoogleSignIn() {
      try {
        await GoogleSignIn.initAsync({
          // You may ommit the clientId when the firebase `googleServicesFile` is configured
          // clientId: '<YOUR_IOS_CLIENT_ID>',
          // Provide other custom options...
        });
      } catch ({ message }) {
        alert('GoogleSignIn.initAsync(): ' + message);
      }
    }
  }, []);

  async function FacebooklogIn() {
    try {
      await Facebook.initializeAsync("788451035063636");
      const {
        type,
        token,
        expires,
        permissions,
        declinedPermissions,
      } = await Facebook.logInWithReadPermissionsAsync("788451035063636", {
        permissions: ["public_profile", "email"],
        behavior: 'web'
      });
      if (type === "success") {
        // Get the user's name using Facebook's Graph API
        let data;
        const response = await fetch(
          `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture.height(500)`
        );
        try {
          data = await response.json();
        } catch { }
        try {
          //LOGIN
          const response = await api.post("/signin", {
            email: data.email,
            password: '',
            type: 'facebook',
            // idGoogle: route.params.type == 'google' ? tempUser.id : '',
            idFacebook: data.id
          });
          const login = await response.data;
          await AsyncStorage.setItem("token", login.token.toString());
          await AsyncStorage.setItem("user", login.id.toString());
          await AsyncStorage.setItem("userName", login.name.toString());
          await AsyncStorage.setItem("userTags", login.tags.toString());
          singIn();
        } catch (e) {
          navigateToTags(data, 'facebook');
        }
        //
      } else {
        // type === 'cancel'
      }
    } catch ({ message }) {
      alert(`Facebook Login Error: ${message}`);
    }
  }

  async function GoogleLogIn() {
    let googleRequest;
    // try {
    //   googleRequest = await Google.logInAsync({
    //     behavior: 'web',
    //     androidClientId:
    //       "366556546753-3da9s6fs4erjut74c3p7usmullq2ep4f.apps.googleusercontent.com",
    //     iosClientId:
    //       "366556546753-nfk1ao48565161rmicqg85ivc9gab100.apps.googleusercontent.com",
    //     androidStandaloneAppClientId: "AIzaSyDMADBLwn9Fqq9yoFo3Imv8KuUJPRzyz5Q",
    //     scopes: ["profile", "email"],
    //   });
    // } catch (e) {
    //   console.log("Requisição ao google falhou");
    //   console.log(e);
    // }

    try {
      await GoogleSignIn.askForPlayServicesAsync();
      googleRequest = await GoogleSignIn.signInAsync({
        scopes: ["profile", "email"],
      });
    } catch ({ message }) {
      Alert.alert('login: Error:' + JSON.stringify(message));
    }
    Alert.alert('erro:',JSON.stringify(googleRequest.user))
    if (googleRequest.type === "success") {
      let loginRequest;
      //LOGIN
      try {
        loginRequest = await api.post("/signin", {
          email: googleRequest.user.email,
          password: '',
          type: 'google',
          idGoogle: googleRequest.user.uid
          // idFacebook: data.id
        });
        await AsyncStorage.setItem("user", loginRequest.data.id.toString());
        await AsyncStorage.setItem("token", loginRequest.data.token.toString());
        await AsyncStorage.setItem("userName", loginRequest.data.name.toString());
        await AsyncStorage.setItem("userTags", loginRequest.data.tags.toString());
        singIn();
      } catch (e) {
        Alert.alert('User:' + JSON.stringify(e))
        navigateToTags(googleRequest.user, 'google');
      }
    } else {
      console.log("Login com google não obteve sucesso");
      console.log(googleRequest);
    }
  }

  return (
    <View style={styles.Container}>
      <StatusBar
        barStyle="light-content"
        translucent={false}
        backgroundColor={"#365478"}
      />
      <View style={styles.Header}>
        <Animatable.Image
          animation="fadeInUpBig"
          duration={1500}
          source={logo}
          style={styles.Logotype}
          resizeMode="stretch"
        />
      </View>
      <Animatable.View style={styles.Footer} animation="fadeInUpBig">
        <Text style={styles.Title}>
          Entre e faça parte dos nossos grupos de estudos!
        </Text>
        <View style={{ justifyContent: "center", alignItems: "flex-end" }}>
          <Text style={styles.Texto}>Faça o login com sua conta:</Text>
        </View>
        <View style={styles.Button}>
          <View
            style={{
              alignContent: "center",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity style={styles.Google} onPress={GoogleLogIn}>
              <Image style={{ width: 25, height: 25 }} source={googleIcon} />
              <Text style={styles.GoogleF}> Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.Facebook} onPress={FacebooklogIn}>
              <Image style={{ width: 25, height: 25 }} source={facebookIcon} />
              <Text style={styles.FacebookF}> Facebook</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={navigateToLogin} style={styles.Register}>
            <Text style={styles.Inicie}>Entre já</Text>
            <MaterialIcons
              name="navigate-next"
              color="#FFC300"
              size={25}
            ></MaterialIcons>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </View>
  );
}
