import React, { useState, useEffect } from "react";

import {
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  View,
  AsyncStorage,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import api from "../../services/api";
import * as Animatable from "react-native-animatable";
import * as ImagePicker from "expo-image-picker";
import UserPermission from "../../UserPermissions";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

import styles from "./styles";
import Feather from "react-native-vector-icons/Feather";
import { AuthContext } from "../../context";
import Posts from "../../Components/Posts";
import { showError, showSucess } from "../../common";

export default function Profile({ route, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);

  //const navigation = useNavigation()
  const { singOut } = React.useContext(AuthContext);
  //Editar perfil
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");
  const [password, setPassword] = useState("");

  //Usuário
  const [userId, setUserId] = useState(route.params.userId);
  const [loggedUser, setLoggedUser] = useState("");
  const [isLoggedUser, setIsLoggedUser] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  // const [press, setPress] = useState(false);
  const [type, setType] = useState(false);
  const [liked, setLiked] = useState(false);
  const toggleType = (pType) => {
    setType(pType);
  };
  const toggleLiked = () => {
    setLiked((liked) => !liked);
  };

  //Imagem
  const [avatar, setAvatar] = useState(
    "https://www.colegiodepadua.com.br/img/user.png"
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  //Posts do usuário
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser(route.params.userId);
  }, [route.params.userId]);

  useEffect(() => {
    reload();
    async function reload() {
      await reloadPosts();
    }
  }, [route.params.userId, type, liked]);

  function logoutUser() {
    AsyncStorage.clear();
    singOut();
  }

  function handleModal() {
    setModalVisible(!modalVisible);
  }

  async function loadUser(id) {
    try {
      const usuarioAtual = await AsyncStorage.getItem("user");
      setLoggedUser(usuarioAtual);
      const response = await api.get(`/users/${id}`, {
        headers: { user_id: usuarioAtual },
      });
      if (response.data) {
        setName(response.data.user.name);
        setEmail(response.data.user.email);
        setTags(response.data.user.tags);
        setUserId(response.data.user._id);
        setPassword(response.data.user.password);
        if (response.data.user.url && response.data.user.url != "") {
          setAvatar(response.data.user.url);
        } else {
          setAvatar("https://www.colegiodepadua.com.br/img/user.png");
        }
        setIsBlocked(response.data.isBlocked);
        setIsFollowed(response.data.isFollowed);
      }

      if (usuarioAtual === id) {
        setIsLoggedUser(true);
      } else {
        setIsLoggedUser(false);
      }
    } catch (e) {
      showError(e);
    }
    //Carrega os dados do usuário para caso queira alterar
  }

  async function updateUser() {
    const response = await api.put(`/users`, {
      name,
      email,
      tags: tags.toString(","),
      password,
    });
    if(response.status==204){
      showSucess("Perfil atualizado com sucesso!")
    }
    setPassword("");
    handleModal();
  }

  async function blockUser() {
    try {
      const usuarioAtual = await AsyncStorage.getItem("user");

      const response = await api.post(
        `/users/${route.params.userId}/block`,
        {},
        { headers: { user_id: usuarioAtual } }
      );
      if (response.status == 204) {
        showSucess("Usuário bloqueado com sucesso");
      } else if (response.status == 201) {
        showSucess("Usuário desbloqueado com sucesso");
      } else {
        showError("Ocorreu um erro ao processar a requisição!");
      }
      loadUser(route.params.userId);
    } catch (e) {
      showError("Erro: " + e);
    }
  }

  async function followUser() {
    try {
      const usuarioAtual = await AsyncStorage.getItem("user");

      const response = await api.post(
        `/users/${route.params.userId}/follow`,
        {},
        { headers: { user_id: usuarioAtual } }
      );
      if (response.status == 204) {
        showSucess("Usuário seguido com sucesso");
      } else if (response.status == 201) {
        showSucess("Usuário deixou de ser seguido com sucesso");
      } else {
        showError("Ocorreu um erro ao processar a requisição!");
      }
      loadUser(route.params.userId);
    } catch (e) {
      showError("Erro: " + e);
    }
  }

  async function loadPosts() {
    if (loading) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }

    if (total > 0 && posts.length == total) {
      //Impede que faça a requisição caso a qtd máxima já tenha sido atingida
      return;
    }
    setLoading(true); //Altera para o loading iniciado
    try {
      let response;
      if (liked === true) {
        response = await api.get(`/users/${route.params.userId}/liked`, {
          headers: { type },
          params: { page },
        });
      } else {
        response = await api.get(`/users/${route.params.userId}/posts`, {
          headers: { type },
          params: { page },
        });
      }

      setPosts([...posts, ...response.data]);
      setTotal(response.headers["x-total-count"]);
      if (response.data.length > 0) {
        setPage(page + 1);
      }
    } catch (e) {
      showError(e);
    }
    setLoading(false); //Conclui o load
  }

  async function reloadPosts() {
    if (refreshing) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }
    setRefreshing(true); //Altera para o loading iniciado
    try {
      let response;
      if (liked === true) {
        response = await api.get(`/users/${route.params.userId}/liked`, {
          headers: { type },
          params: { page: 1 },
        });
      } else {
        response = await api.get(`/users/${route.params.userId}/posts`, {
          headers: { type },
          params: { page: 1 },
        });
      }
      setPosts(response.data);
      if (response.data.length > 0) {
        setPage(2);
      }
    } catch (e) {
      showError(e);
    }
    setRefreshing(false);
  }

  renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  };

  async function handlePickUpdate() {
    UserPermission.getCameraPermission();

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.cancelled) {
      setAvatar(result);
      setIsUploadingImage(true);
    }
  }

  async function handleSubmitPhoto() {
    let localUri = avatar.uri;
    let filename = localUri.split("/").pop();
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;
    try {
      const data = new FormData();
      data.append("file", { uri: localUri, name: filename, type });
      const response = await api.post(
        `/users/${route.params.userId}/photo`,
        data
      );
      if (response.status == 201) {
        showSucess("Foto alterada com sucesso");
        setIsUploadingImage(false);
        await loadUser(route.params.userId);
        await reloadPosts()
      } else {
        showError(response);
      }
    } catch (e) {
      showError(e);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.modalView}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleModal}
        >
          <TouchableWithoutFeedback onPress={handleModal}>
            <View style={styles.modalContent}>
              <View style={styles.modalBody}>
                <ScrollView>
                  <View style={styles.indicator} />

                  <View style={styles.modalPerfil}>
                    <Text></Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.perfilTitle}>Editar Perfil </Text>
                      <Feather name="edit" size={17} color="#365478"></Feather>
                    </View>
                    {true ? (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Excluir",
                              "Deseja excluir seu perfil?",
                              [
                                {
                                  text: "Não",
                                  onPress: () => {
                                    return null;
                                  },
                                },
                                {
                                  text: "Sim",
                                  onPress: () => {},
                                },
                              ],
                              { cancelable: false }
                            )
                          }
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 10,
                          }}
                        >
                          <Feather
                            name="trash-2"
                            size={15}
                            color="#E73751"
                          ></Feather>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <></>
                    )}
                  </View>
                  <View style={styles.viewInput}>
                    <Text style={styles.modalSubtitle}>Nome</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Altere seu nome..."
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                      autoCorrect={false}
                      value={name}
                      onChangeText={setName}
                      numberOfLines={2}
                      returnKeyType = { "next" }
                      onSubmitEditing={() => { this.secondTextInput.focus(); }}
                      blurOnSubmit={false}
                    />
                    <Text style={styles.modalSubtitle}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Altere seu email..."
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      numberOfLines={2}
                      returnKeyType = { "next" }
                      onSubmitEditing={() => { this.thirdTextInput.focus(); }}
                      blurOnSubmit={false}
                      ref={(input) => { this.secondTextInput = input; }}
                    />
                    <Text style={styles.modalSubtitle}>Tags</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Altere suas tags de preferência..."
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                      autoCorrect={false}
                      value={tags.join(', ')}
                      onChangeText={setTags}
                      numberOfLines={2}
                      returnKeyType = { "next" }
                      onSubmitEditing={() => { this.fourthTextInput.focus(); }}
                      blurOnSubmit={false}
                      ref={(input) => { this.thirdTextInput = input; }}
                    />
                    <Text style={styles.modalSubtitle}>Senha</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Preencha caso deseje alterar sua senha..."
                      placeholderTextColor="#999"
                      secureTextEntry={true}
                      password={true}
                      autoCapitalize="words"
                      autoCorrect={false}
                      value={password}
                      onChangeText={setPassword}
                      numberOfLines={2}
                      returnKeyType = { "done" }
                      onSubmitEditing={handleModal}
                      blurOnSubmit={false}
                      ref={(input) => { this.fourthTextInput = input; }}
                    />
                  </View>
                  <View style={styles.buttonView}>
                    <TouchableOpacity
                      onPress={updateUser}
                      style={styles.button}
                    >
                      <Text style={styles.buttonText}>Salvar</Text>
                      <Feather name="check" size={15} color="#FFC300"></Feather>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleModal}
                      style={styles.button}
                    >
                      <Text style={styles.buttonText}>Cancelar</Text>
                      <Feather
                        name="x-circle"
                        size={15}
                        color="#FFC300"
                      ></Feather>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.openDrawer()}
        >
          <Feather name="menu" size={20} color="#FFC300"></Feather>
        </TouchableOpacity>
        {isLoggedUser ? (
          <>
            <TouchableOpacity
              onPress={handleModal}
              style={styles.detailsButton}
            >
              <Feather name="edit" size={20} color="#FFC300"></Feather>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {!isBlocked ? (
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                }}
              >
                <TouchableOpacity
                  style={styles.detailsButton}
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
                            blockUser();
                          },
                        },
                      ],
                      { cancelable: false }
                    )
                  }
                >
                  <Feather name="slash" size={25} color="#E73751"></Feather>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailsButton, { paddingLeft: 20 }]}
                  onPress={() =>
                    Alert.alert(
                      `${isFollowed ? "Deixar de seguir" : "Seguir"}`,
                      `Deseja realmente ${
                        isFollowed ? "deixar de " : ""
                      }seguir o usuário?`,
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
                            followUser();
                          },
                        },
                      ],
                      { cancelable: false }
                    )
                  }
                >
                  <Feather
                    name={isFollowed ? "user-minus" : "user-plus"}
                    size={25}
                    color="#7DCEA0"
                  ></Feather>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                }}
              >
                <TouchableOpacity
                  style={styles.detailsButton}
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
                            blockUser();
                          },
                        },
                      ],
                      { cancelable: false }
                    )
                  }
                >
                  <Feather
                    name="check-circle"
                    size={25}
                    color="#7DCEA0"
                  ></Feather>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        <TouchableOpacity
          style={styles.detailsButton}
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
        >
          <Feather name="log-out" size={20} color="#FFC300"></Feather>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.circle}
        onPress={() =>
          isLoggedUser
            ? Alert.alert(
                "Alterar",
                "Deseja alterar a foto de Perfil?",
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
                      handlePickUpdate();
                    },
                  },
                ],
                { cancelable: false }
              )
            : null
        }
      >
        <Image
          style={styles.avatar}
          source={{
            uri: isUploadingImage
              ? avatar.uri
              : `${avatar}`
          }}
        />
      </TouchableOpacity>
      <View style={styles.body}>
        <View style={styles.perfilName}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.info}>{tags.join(', ')}</Text>
        </View>
        {isUploadingImage && isLoggedUser ? (
          <TouchableOpacity
            onPress={handleSubmitPhoto}
            style={[
              styles.button,
              { width: 150, alignSelf: "center", margin: 3 },
            ]}
          >
            <Text style={styles.buttonText}>Enviar imagem</Text>
            <Feather name="check" size={15} color="#FFC300"></Feather>
          </TouchableOpacity>
        ) : null}
      </View>
      <Animatable.View
        style={styles.footer}
        animation="fadeInUp"
        duration={900}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 30,
          }}
        >
          <Text style={{ color: "#FFC300", fontWeight: "bold" }}>Enviadas</Text>
          <Switch
            trackColor={{ false: "#FFC300", true: "#fff" }}
            thumbColor={liked ? "#fff" : "#FFC300"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleLiked}
            value={liked}
          />
          <Text style={{ color: "white", fontWeight: "bold" }}>Curtidas</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: hp("8.5%"),
            top: 2,
          }}
        >
          <TouchableOpacity
            style={styles.detailsBar}
            onPress={() => toggleType(false)}
          >
            <Text
              style={[
                styles.detailsButtonText,
                { color: type == false ? "#FFC300" : "white" },
              ]}
            >
              Dúvidas
            </Text>
            <Feather
              name="edit-3"
              size={16}
              color={type == false ? "#FFC300" : "white"}
            ></Feather>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.detailsBar}
            onPress={() => toggleType(true)}
          >
            <Text
              style={[
                styles.detailsButtonText,
                { color: type == true ? "#FFC300" : "white" },
              ]}
            >
              Conteúdos
            </Text>
            <Feather
              name="book-open"
              size={16}
              color={type == true ? "#FFC300" : "white"}
            ></Feather>
          </TouchableOpacity>
        </View>
      </Animatable.View>

      <Posts
        posts={posts}
        reloadPosts={reloadPosts}
        refreshing={refreshing}
        loadPosts={loadPosts}
        searchSolved={false}
        searchFavorite={false}
        loading={loading}
        navigation={navigation}
      />
    </View>
  );
}
