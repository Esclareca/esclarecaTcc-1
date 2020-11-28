import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Alert,
  View,
  AsyncStorage,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  Feather,
  FontAwesome5,
  Foundation,
  FontAwesome,
} from "@expo/vector-icons";
import { Avatar } from "react-native-elements";
import { DotsLoader } from "react-native-indicator";
import { AuthContext } from "./context";
import api from "./services/api";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  createDrawerNavigator,
  DrawerItem,
  DrawerContentScrollView,
} from "@react-navigation/drawer";

import Init from "./pages/Init";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NewPost from "./pages/NewPost";
import Profile from "./pages/Profile";
import PostPage from "./pages/PostPage";
import Preferences from "./pages/Preferences";
import Ranking from "./pages/Ranking";
import HomeSlack from "./pages/HomeSlack";
import SlackPage from "./pages/SlackPage";
import Network from "./pages/Network";
import Password from "./pages/Password";
import Tags from "./pages/Tags";
import ResetPass from "./pages/ResetPass";

const AppStack = createStackNavigator();
const App2Stack = createStackNavigator();
const HomeStack = createStackNavigator();
const MainStack = createStackNavigator();
const Main2Stack = createStackNavigator();
const drawer = createDrawerNavigator();
const Main3Stack = createStackNavigator();

const AuthStack = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Init" component={Init}></HomeStack.Screen>
    <HomeStack.Screen name="Login" component={Login}></HomeStack.Screen>
    <HomeStack.Screen name="Password" component={Password}></HomeStack.Screen>
    <HomeStack.Screen name="Register" component={Register}></HomeStack.Screen>
    <HomeStack.Screen name="Tags" component={Tags}></HomeStack.Screen>
    <HomeStack.Screen name="ResetPass" component={ResetPass}></HomeStack.Screen>
  </HomeStack.Navigator>
);

const PostStack = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Home" component={Home}></MainStack.Screen>
    <MainStack.Screen name="NewPost" component={NewPost}></MainStack.Screen>
    <MainStack.Screen name="PostPage" component={PostPage}></MainStack.Screen>
  </MainStack.Navigator>
);

const SlackStack = () => (
  <Main3Stack.Navigator screenOptions={{ headerShown: false }}>
    <Main3Stack.Screen
      name="HomeSlack"
      component={HomeSlack}
    ></Main3Stack.Screen>
    <Main3Stack.Screen
      name="SlackPage"
      component={SlackPage}
    ></Main3Stack.Screen>
  </Main3Stack.Navigator>
);

const NetworkStack = () => (
  <Main2Stack.Navigator screenOptions={{ headerShown: false }}>
    <Main2Stack.Screen name="Network" component={Network}></Main2Stack.Screen>
  </Main2Stack.Navigator>
);

const drawerNavigator = () => (
  <drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
  >
    <drawer.Screen name="Home" component={PostStack}></drawer.Screen>
    <drawer.Screen name="Profile" component={Profile}></drawer.Screen>
    <HomeStack.Screen name="Tags" component={Tags}></HomeStack.Screen>
    <drawer.Screen name="Preferences" component={Preferences}></drawer.Screen>
    <drawer.Screen name="Ranking" component={Ranking}></drawer.Screen>
    <drawer.Screen name="HomeSlack" component={SlackStack}></drawer.Screen>
    <drawer.Screen name="Network" component={NetworkStack}></drawer.Screen>
  </drawer.Navigator>
);

//continuar aqui
function CustomDrawerContent(props) {
  const [userName, setName] = useState("");
  const [userTags, setTags] = useState("");
  const [userId, setId] = useState("");
  const [press, setPress] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [page, setPage] = useState("feed");
  //const navigation = useNavigation()

  const { singOut } = React.useContext(AuthContext);

  function logoutUser() {
    AsyncStorage.clear();
    singOut();
  }

  async function loadUser() {
    const user = await AsyncStorage.getItem("user");
    if (user) {
      const response = await api.get(`/users/${user}`, {
        headers: { user_id: user },
      });
      if (response.data) {
        setName(response.data.user.name);
        setTags(response.data.user.tags);
        setId(response.data.user._id);
        setAvatar(response.data.user.url);
      }
    }
  }

  useEffect(() => {
    loadUser();
  }, [press]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerContent}>
          <View style={styles.User}>
            <TouchableOpacity
              onPress={() => {
                setPage('profile')
                setPress((previousState) => !previousState);
                props.navigation.navigate("Profile", { userId });
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 15,
                  alignItems: "center",
                }}
              >
                <Avatar
                  rounded
                  source={{
                    uri: avatar ? avatar : "https://www.colegiodepadua.com.br/img/user.png",
                  }}
                  size={50}
                />
                <View
                  style={{
                    marginLeft: 15,
                    flexDirection: "column",
                    maxWidth: 200,
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: page == "profile" ? "#FFC300" : "black" }}>
                    {userName ? userName : "Meu perfil"}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#365478" }}>
                    {userTags ? userTags.join(', ') : ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.Section}>
            <DrawerItem
              icon={() => (
                <Feather
                  name="book-open"
                  size={20}
                  color={page == "feed" ? "#FFC300" : "#365478"}
                ></Feather> //edit-3
              )}
              label="Feed"
              onPress={() => {
                setPage("feed");
                props.navigation.navigate("Home");
              }}
            />
            <DrawerItem
              icon={() => (
                <Foundation
                  name="lightbulb"
                  size={23}
                  color={page == "homeslack" ? "#FFC300" : "#365478"}
                ></Foundation>
              )}
              label="EsclaChat"
              onPress={() => {
                setPage("homeslack");
                props.navigation.navigate("HomeSlack");
              }}
            />
            <DrawerItem
              icon={() => (
                <FontAwesome
                  name="users"
                  size={18}
                  color={page == "conexoes" ? "#FFC300" : "#365478"}
                ></FontAwesome>
              )}
              label="Conexões"
              onPress={() => {
                setPage("conexoes");
                props.navigation.navigate("Network");
              }}
            />
            <DrawerItem
              icon={() => (
                <FontAwesome5
                  name="medal"
                  size={20}
                  color={page == "ranking" ? "#FFC300" : "#365478"}
                ></FontAwesome5>
              )}
              label="Ranking"
              onPress={() => {
                setPage("ranking");
                props.navigation.navigate("Ranking");
              }}
            />
            <DrawerItem
              icon={() => (
                <Feather
                  name="sliders"
                  size={20}
                  color={page == "preferencias" ? "#FFC300" : "#365478"}
                ></Feather>
              )}
              label="Preferências"
              onPress={() => {
                setPage("preferencias");
                props.navigation.navigate("Preferences");
              }}
            />
          </View>
        </View>
      </DrawerContentScrollView>
      <View style={styles.Logout}>
        <DrawerItem
          icon={() => (
            <Feather name="log-out" size={20} color="#365478"></Feather>
          )}
          label="Sair"
          onPress={() =>
            Alert.alert(
              "Sair",
              "Deseja Sair?",
              [
                {
                  text: "Cancelar",
                  onPress: () => {
                    return null;
                  },
                },
                {
                  text: "Sair",
                  onPress: () => {
                    logoutUser();
                  },
                },
              ],
              { cancelable: false }
            )
          }
        />
      </View>
    </View>
  );
}

export default function Routes() {
  const [isloading, setisLoading] = React.useState(true);
  const [userToken, setUserToken] = React.useState(null);

  const authContext = React.useMemo(() => {
    return {
      singIn: () => {
        setisLoading(false);
        setUserToken(AsyncStorage.getItem("user"));
      },
      singOut: () => {
        setisLoading(false);
        setUserToken(null);
      },
    };
  }, []);

  React.useEffect(() => {
    AsyncStorage.getItem("user").then((user) => {
      if (user) {
        setUserToken(AsyncStorage.getItem("user"));
      } else {
        setUserToken(null);
      }
    });
  }, []);

  React.useEffect(() => {
    setTimeout(() => {
      setisLoading(false);
    }, 1000);
  }, []);

  if (isloading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <DotsLoader style={{ color: "#365478" }} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        {userToken ? (
          <AppStack.Navigator screenOptions={{ headerShown: false }}>
            <AppStack.Screen
              name="Home"
              component={drawerNavigator}
            ></AppStack.Screen>
          </AppStack.Navigator>
        ) : (
            <App2Stack.Navigator screenOptions={{ headerShown: false }}>
              <App2Stack.Screen
                name="Init"
                component={AuthStack}
              ></App2Stack.Screen>
            </App2Stack.Navigator>
          )}
        {/*<AppStack.Navigator screenOptions={{ headerShown: false }}>
                    <AppStack.Screen name="Init" component={Init}></AppStack.Screen>
                    <AppStack.Screen name="Login" component={Login}></AppStack.Screen>
                    <AppStack.Screen name="Register" component={Register}></AppStack.Screen>
                    <AppStack.Screen name="Home" component={Home}></AppStack.Screen>
                    <AppStack.Screen name="NewPost" component={NewPost}></AppStack.Screen>
                    <AppStack.Screen name="HomeContent" component={HomeContent}></AppStack.Screen>
                    <AppStack.Screen name="NewContent" component={NewContent}></AppStack.Screen>
                </AppStack.Navigator>*/}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  Logout: {
    marginBottom: 15,
    borderTopColor: "#f4f4f4",
    borderTopWidth: 1,
  },
  drawerContent: {
    flex: 1,
  },
  User: {
    paddingLeft: 20,
  },
  Section: {
    marginTop: 14,
    borderTopColor: "#f4f4f4",
    borderTopWidth: 3,
  },
});
