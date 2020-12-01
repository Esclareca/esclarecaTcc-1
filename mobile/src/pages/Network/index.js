import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  AsyncStorage,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import { AdMobBanner } from "expo-ads-admob";

import styles from "./styles";
import { showError, showSucess } from "../../common";
import api from "../../services/api";
import { handleLimitBigText } from "../../common";

export default function Network() {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [modoTela, setModoTela] = useState("todos");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPage();
    async function loadPage() {
      await loadBlockedFollowedUsers();
      await reloadUsers();
    }
  }, []);

  function navigateToProfile(userId) {
    navigation.navigate("Profile", {
      userId,
    });
  }
  async function loadBlockedFollowedUsers() {
    const usuarioAtual = await AsyncStorage.getItem("user");
    const response = await api.get(`/users/${usuarioAtual}`, {
      headers: { user_id: usuarioAtual },
    });
    if (response.data) {
      setBlockedUsers(response.data.user.blocked);
      setFollowedUsers(response.data.user.followed);
    }
  }

  async function loadUsers() {
    if (loading) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }

    if (total > 0 && users.length == total) {
      //Impede que faça a requisição caso a qtd máxima já tenha sido atingida
      return;
    }

    try {
      const response = await api.get(`/users`, {
        headers: { search_text: searchText },
        params: { page },
      });

      if (response.status == 200) {
        setUsers([...users, ...response.data]);
        setPage(page + 1);
        setTotal(response.headers["x-total-count"]);
      } else {
        showError(response.data);
      }

      setLoading(false); //Conclui o load
    } catch (e) {
      showError(e);
    }
  }
  async function reloadUsers() {
    if (refreshing) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }

    try {
      const response = await api.get(`/users`, {
        headers: { search_text: searchText },
        params: { page: 1 },
      });

      if (response.status == 200) {
        setUsers(response.data);
        setPage(2);
        setTotal(response.headers["x-total-count"]);
      } else {
        showError(response.data);
      }
      setRefreshing(false); //Conclui o load
    } catch (e) {
      showError(e);
    }
  }
  async function blockDesblockUser(uId) {
    try {
      const usuarioAtual = await AsyncStorage.getItem("user");

      if (uId == usuarioAtual) {
        showError("Não é possível bloquear você mesmo");
        return;
      }
      const response = await api.post(
        `/users/${uId}/block`,
        {},
        { headers: { user_id: usuarioAtual } }
      );
      if (response.status == 204) {
        showSucess("Usuário bloqueado com sucesso");
      }
      if (response.status == 201) {
        showSucess("Usuário desbloqueado com sucesso");
      }
      await loadBlockedFollowedUsers();
      await reloadUsers();
    } catch (e) {
      showError(e);
    }
  }
  async function followUnfollowUser(uId) {
    try {
      const usuarioAtual = await AsyncStorage.getItem("user");

      if (uId == usuarioAtual) {
        showError("Não é possível seguir você mesmo");
        return;
      }
      const response = await api.post(
        `/users/${uId}/follow`,
        {},
        { headers: { user_id: usuarioAtual } }
      );
      if (response.status == 204) {
        showSucess("Usuário seguido com sucesso");
      }
      if (response.status == 201) {
        showSucess("Usuário parou de ser seguido com sucesso");
      }
      await loadBlockedFollowedUsers();
      await reloadUsers();
    } catch (e) {
      showError(e);
    }
  }
  renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Feather name="menu" size={20} color="#FFC300"></Feather>
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
            Conexões
          </Text>
          <FontAwesome
            name="users"
            size={18}
            color="#FFC300"
            style={{ marginTop: 2 }}
          />
        </View>
      </View>

      <View style={styles.Search}>
        <TextInput
          style={styles.input}
          placeholder="Pesquise o usuário desejado..."
          placeholderTextColor="#999"
          autoCapitalize="words"
          autoCorrect={false}
          value={searchText}
          onChangeText={setSearchText}
          //multiline={true}
          numberOfLines={2}
          returnKeyType="search"
          onSubmitEditing={() => {
            reloadUsers();
          }}
          blurOnSubmit={false}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={reloadUsers}>
            <Feather
              name="search"
              size={18}
              color="#FFC300"
              style={{ marginTop: 2, marginRight: 20 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          top: 5,
          marginBottom: 5,
          paddingHorizontal: "4%",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => setModoTela("todos")}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "bold",
              color: modoTela === "todos" ? "#FFC300" : "#365478",
            }}
          >
            Todos os Usuários
          </Text>
        </TouchableOpacity>
        <View style={{ alignItems: "flex-end" }}>
          <TouchableOpacity onPress={() => setModoTela("bloqs")}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: modoTela === "bloqs" ? "#FFC300" : "#365478",
              }}
            >
              Bloqueados
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModoTela("follow")}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: modoTela === "follow" ? "#FFC300" : "#365478",
              }}
            >
              Seguidos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(user) => String(user._id)}
        refreshing={refreshing}
        onRefresh={reloadUsers}
        onEndReached={loadUsers}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: user }) => (
          <Animatable.View
            style={styles.post}
            animation="fadeInDown"
            duration={1000}
          >
            {modoTela === "todos" ||
              (modoTela === "bloqs" && blockedUsers.includes(user._id)) ||
              (modoTela == "follow" && followedUsers.includes(user._id)) ? (
                <View style={styles.postHeader}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        style={styles.avatar}
                        source={{
                          uri: user.url
                            ? user.url
                            : "https://www.colegiodepadua.com.br/img/user.png",
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => navigateToProfile(user._id)}
                      >
                        <View style={{ marginLeft: 5 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#365478",
                              fontWeight: "bold",
                            }}
                          >
                            {handleLimitBigText(user.name, 20)}
                          </Text>
                          <Text style={styles.postTag}>
                            {/* {user.tags.map((tag) => tag.name).join(',')} */}
                            {handleLimitBigText(user.tags.map((tag) => tag.name).join(', '), 20)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginRight: 25,
                        }}
                      >
                        <Feather name="award" size={17} color="#F5B7B1" />
                        <Text style={{ fontSize: 12, color: "#F5B7B1" }}>
                          {user.ranking} pontos
                      </Text>
                      </View>
                      {!blockedUsers.includes(user._id) ? (
                        <>
                          <TouchableOpacity
                            onPress={() =>
                              Alert.alert(
                                "Bloquear",
                                "Deseja realmente bloquear o usuário?",
                                [
                                  {
                                    text: "Não",
                                    onPress: () => {
                                      return null;
                                    },
                                  },
                                  {
                                    text: "Sim",
                                    onPress: () => {
                                      blockDesblockUser(user._id);
                                    },
                                  },
                                ],
                                { cancelable: false }
                              )
                            }
                          >
                            <Feather
                              name="slash"
                              size={20}
                              color="#E73751"
                            ></Feather>
                          </TouchableOpacity>
                          {!followedUsers.includes(user._id) ? (
                            <View style={{ paddingLeft: 5 }}>
                              <TouchableOpacity
                                onPress={() =>
                                  Alert.alert(
                                    "Seguir",
                                    "Deseja realmente seguir o usuário?",
                                    [
                                      {
                                        text: "Não",
                                        onPress: () => {
                                          return null;
                                        },
                                      },
                                      {
                                        text: "Sim",
                                        onPress: () => {
                                          followUnfollowUser(user._id);
                                        },
                                      },
                                    ],
                                    { cancelable: false }
                                  )
                                }
                              >
                                <Feather
                                  name="user-plus"
                                  size={20}
                                  color="#7DCEA0"
                                />
                              </TouchableOpacity>
                            </View>
                          ) : null}

                          {followedUsers.includes(user._id) ? (
                            <View style={{ paddingLeft: 5 }}>
                              <TouchableOpacity
                                onPress={() =>
                                  Alert.alert(
                                    "Seguir",
                                    "Deseja realmente parar de seguir o usuário?",
                                    [
                                      {
                                        text: "Não",
                                        onPress: () => {
                                          return null;
                                        },
                                      },
                                      {
                                        text: "Sim",
                                        onPress: () => {
                                          followUnfollowUser(user._id);
                                        },
                                      },
                                    ],
                                    { cancelable: false }
                                  )
                                }
                              >
                                <Feather
                                  name="user-minus"
                                  size={20}
                                  color="#7DCEA0"
                                />
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </>
                      ) : null}

                      {blockedUsers.includes(user._id) ? (
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Desbloquear",
                              "Deseja realmente desbloquear o usuário?",
                              [
                                {
                                  text: "Não",
                                  onPress: () => {
                                    return null;
                                  },
                                },
                                {
                                  text: "Sim",
                                  onPress: () => {
                                    blockDesblockUser(user._id);
                                  },
                                },
                              ],
                              { cancelable: false }
                            )
                          }
                        >
                          <Feather
                            name="check-circle"
                            size={20}
                            color="#7DCEA0"
                          ></Feather>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : null}
          </Animatable.View>
        )}
      ></FlatList>
      <AdMobBanner
        bannerSize="banner"
        adUnitID="ca-app-pub-6671400449354043/9787917658"
        servePersonalizedAds
        onDidFailToReceiveAdWithError={(err) => console.log(err)}
        style={{ alignItems: "center" }}
      />
    </View>
  );
}
