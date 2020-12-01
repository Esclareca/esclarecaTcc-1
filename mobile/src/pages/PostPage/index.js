import React, { useState, useEffect } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  AsyncStorage,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

import api from "../../services/api";
import * as Notifications from "expo-notifications";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

import styles from "./styles";
import * as Animatable from "react-native-animatable";

import { showError, showSucess, handleDate } from "../../common";
import * as DocumentPicker from "expo-document-picker";

export default function PostPage({ route, navigation }) {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userIsPostOwner, setUserIsPostOwner] = useState(false);
  const [post, setPost] = useState(route.params.post);
  const [activeUser, setActiveUser] = useState("");
  const [press, setPress] = useState(false);

  const [files, setFiles] = useState(); //No post
  const [file1, setFile1] = useState(null); //Local
  const [file2, setFile2] = useState(null); //Local
  const [isUploadingFile, setIsUploadingFile] = useState(0); //Controla se esta fazendo upload
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    handleID();
    async function handleID() {
      const user_id = await AsyncStorage.getItem("user");
      setActiveUser(user_id);
      if (user_id === post.user._id) {
        setUserIsPostOwner(true);
      }
    }
  }, [route.params.post]);

  useEffect(() => {
    rePost();
    async function rePost() {
      // const user_id = await AsyncStorage.getItem("user");
      await reloadPage();
    }
  }, [press]);

  function navigateToHome() {
    navigation.navigate("Home");
  }

  function navigateToProfile(userId) {
    navigation.navigate("Profile", {
      userId,
    });
  }

  async function handlePostComment() {
    if (commentText.trim() == "") {
      showError("Digite um comentário válido");
    } else {
      const user_id = await AsyncStorage.getItem("user");
      try {
        const response = await api.post(
          `/posts/${post._id}`,
          {
            message: commentText,
          },
          {
            headers: { user: user_id },
          }
        );

        if (response.status == 204) {
          // showSucess("Comentário cadastrado com sucesso");
          setCommentText("");
          setPress(!press);
          //sendPushNotification(post.user.pushToken)
        } else {
          showError("Ocorreu um erro");
        }
      } catch (e) {
        showError(e);
      }
    }
  }

  async function sendPushNotification(expoPushToken) {
    const username = await AsyncStorage.getItem("userName");
    const message = {
      to: "ExponentPushToken[z5d3gwOStqhteOGkL_zYO3]",
      sound: "default",
      title: "Novo comentário",
      body: username + " enviou um comentário em teu post.",
      data: { data: "goes here" },
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  }

  async function loadComments() {
    if (loading) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }

    if (total > 0 && comments.length == total) {
      //Impede que faça a requisição caso a qtd máxima já tenha sido atingida
      return;
    }

    setLoading(true); //Altera para o loading iniciado
    try {
      const user_id = await AsyncStorage.getItem("user");
      const response = await api.get(`/posts/${post._id}`, {
        headers: { user_id },
        params: { page },
      });
      setComments([...comments, ...response.data]);
      if (response.data.length > 0) {
        setPage(page + 1);
        setTotal(response.headers["x-total-count"]);
      }
    } catch (e) {
      showError(e);
    }
    setLoading(false); //Conclui o load
  }
  async function reloadPost(user_id) {
    try {
      const response = await api.get(`/post/${post._id}`, {
        headers: { user_id },
      });
      if (response.data.files) {
        if (response.data.files[0]) {
          setFile1(response.data.files[0]);
        }
        if (response.data.files[1]) {
          setFile2(response.data.files[1]);
        }
      }
      setPost(response.data[0]);
    } catch (e) {
      showError("Aconteceu um erro: \n" + e);
    }
  }
  async function reloadPage() {
    if (refreshing) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }
    const user_id = await AsyncStorage.getItem("user");
    await reloadPost(user_id);

    setRefreshing(true); //Altera para o loading iniciado

    try {
      const response = await api.get(`/posts/${post._id}`, {
        headers: { user_id },
        params: { page: 1 },
      });
      setComments(response.data);
      if (response.data.length > 0) {
        setPage(2);
        setTotal(response.headers["x-total-count"]);
      }
    } catch (e) {
      showError(e);
    }
    setRefreshing(false);
  }
  async function handleDeletePost() {
    const user_id = await AsyncStorage.getItem("user"); //Fazer esse puto entrar no estado
    try {
      const response = await api.delete(`/posts/${post._id}`, {
        headers: { user_id },
      });
      showSucess("Post excluído com sucesso!")
      navigateToHome();
    } catch (e) {
      showError(e);
    }
  }

  async function handleLikePost() {
    const user_id = await AsyncStorage.getItem("user"); //Fazer esse puto entrar no estado
    try {
      const response = await api.post(
        `/posts/${post._id}/like`,
        {},
        {
          headers: { user_id },
        }
      );
      await reloadPost();
    } catch (e) {
      showError(e);
    }
  }

  async function reportPost() {
    const user_id = await AsyncStorage.getItem("user"); //Fazer esse puto entrar no estado
    try {
      const response = await api.post(
        `/posts/${post._id}/report`,
        {},
        {
          headers: { user_id },
        }
      );
      showSucess("Post reportado. Equipe Esclareça agradece seu feedback! ;)");
    } catch (e) {
      showError(e);
    }
  }

  async function handleLikeComment(commId) {
    const user_id = await AsyncStorage.getItem("user"); //Fazer esse puto entrar no estado
    try {
      const response = await api.post(
        `/posts/${post._id}/${commId}/like`,
        {},
        {
          headers: { user_id },
        }
      );
    } catch (e) {
      showError(e);
    }
    setPress(!press);
  }

  async function handleDeleteComment(commId) {
    const user_id = await AsyncStorage.getItem("user"); //Fazer esse puto entrar no estado
    try {
      const response = await api.delete(`/posts/${post._id}/${commId}`, {
        headers: { user_id },
      });
    } catch (e) {
      showError(e);
    }
    await reloadPage();
  }

  async function handleSolvePost(commId) {
    if (userIsPostOwner) {
      const user_id = await AsyncStorage.getItem("user"); //Fazer esse puto entrar no estado
      try {
        const response = await api.post(
          `/posts/${post._id}/${commId}/solve`,
          {},
          {
            headers: { user_id },
          }
        );
        if (response.status == 200) {
          showError("Publicação já solucionado por outro comentário");
        }
      } catch (e) {
        showError(e);
      }
      await reloadPage();
    }
  }

  async function handlePickFile(fileIndex) {
    let result = await DocumentPicker.getDocumentAsync({});
    if (result.type!="cancel") {
      if (fileIndex == 0) {
        setIsUploadingFile(1);
      }
      if (fileIndex == 1) {
        setIsUploadingFile(2);
      }
      setUploadProgress(0);
      handleUploadFile(result, fileIndex);
    }
  }
  const config = {
    onUploadProgress: function (progressEvent) {
      var percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadProgress(percentCompleted);
    },
  };
  async function handleUploadFile(result, fileIndex) {
    let localUri = result.uri;
    let filename = localUri.split("/").pop();
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;
    try {
      const user_id = await AsyncStorage.getItem("user");
      const data = new FormData();
      data.append("file", { uri: localUri, name: result.name, type });
      const response = await api.post(
        `/posts/${post._id}/file`,
        data,
        { headers: { user_id, file_num: fileIndex } },
        config
      );
      if (response.status == 201) {
        showSucess("Arquivo enviado sucesso");
        // await loadUser(route.params.userId);
        // await reloadPosts();
        setPress(!press)
        setUploadProgress(0);
        setIsUploadingFile(0);
      } else {
        showError(response);
      }
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

  async function openFile1(file_ur) {
    await WebBrowser.openBrowserAsync(file_ur);
  }

  async function openFile2(file_ur) {
    await WebBrowser.openBrowserAsync(file_ur);
  }

  return (
    //reidner 26/04
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent={false}
        backgroundColor={"#365478"}
      />
      <View style={styles.headerPost}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigateToHome()}
          >
            <Feather name="chevron-left" size={20} color="#FFC300"></Feather>
          </TouchableOpacity>
          <Text style={styles.DuvidaTitle}>{post.title}</Text>
        </View>
        <View style={styles.DuvidaCorpo}>
          <TouchableOpacity onPress={() => navigateToProfile(post.user._id)}>
            <Image
              style={styles.avatar}
              source={{
                uri: post.user.url
                  ? post.user.url
                  : "https://www.colegiodepadua.com.br/img/user.png",
              }}
            />
          </TouchableOpacity>
          <View style={{ paddingLeft: 10 }}>
            <TouchableOpacity onPress={() => navigateToProfile(post.user._id)}>
              <Text style={styles.CorpoTitle}>{post.user.name}</Text>
              <Text style={styles.Nomepost}>{post.tags.map((tag) => tag.name).join(', ')}</Text>
            </TouchableOpacity>
            <ScrollView>
              <Text
                selectable={true}
                selectionColor="#FFC300"
                style={{
                  fontSize: 15,
                  color: "white",
                  paddingRight: 40,
                  maxHeight: 300,
                }}
              >
                {post.desc}
              </Text>
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                paddingTop: 10,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                   paddingTop: 12,
                   alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 15, fontWeight: "bold" }}
                >
                  {" "}
                  {userIsPostOwner ? "Enviar anexos:" : "Anexos:"}
                </Text>
              </View>
              <View style={{flexDirection:'column'}}>
                {userIsPostOwner ? (
                  <>
                    {file1 ? (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Escolha a opção:",
                              "Deseja enviar um novo arquivo ou visualizar o existente?",
                              [
                                {
                                  text: "Enviar novo",
                                  onPress: () => handlePickFile(0),
                                },
                                {
                                  text: "Visualizar",
                                  onPress: () => openFile1(post.files[0].url),
                                },
                              ],
                              { cancelable: true }
                            )
                          }
                        >
                          <View
                            style={{
                              paddingLeft: 10,
                              top: 10,
                              alignItems: "center",
                              flexDirection: "row"
                            }}
                          >
                            <Ionicons
                              name="ios-attach"
                              size={20}
                              color="#FFC300"
                            ></Ionicons>
                            <Text style={{ color: "#7DCEA0", fontSize: 10, paddingLeft: 5 }}>
                              {isUploadingFile == 1
                                ? `%${uploadProgress}`
                                : post.files[0]
                                ? post.files[0].name
                                : "Anexo 1"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => handlePickFile(0)}>
                          <View
                            style={{
                              paddingLeft: 10,
                              top: 10,
                              alignItems: "center",
                              flexDirection: "row"
                            }}
                          >
                            <Ionicons
                              name="ios-attach"
                              size={20}
                              color="#FFC300"
                            ></Ionicons>
                            <Text style={{ color: "#7DCEA0", fontSize: 10, paddingLeft: 5 }}>
                              {isUploadingFile == 1
                                ? `%${uploadProgress}`
                                : post.files[0]
                                ? post.files[0].name
                                : "Anexo 1"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                    {file2 ? (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Escolha a opção:",
                              "Deseja ver o arquivo ou inserir um novo?",
                              [
                                {
                                  text: "Enviar novo",
                                  onPress: () => handlePickFile(1),
                                },
                                {
                                  text: "Visualizar",
                                  onPress: () => openFile1(post.files[1].url),
                                },
                              ],
                              { cancelable: false }
                            )
                          }
                        >
                          <View
                            style={{
                              paddingLeft: 10,
                              top: 15,
                              alignItems: "center",
                              flexDirection: "row"
                            }}
                          >
                            <Ionicons
                              name="ios-attach"
                              size={20}
                              color="#FFC300"
                            ></Ionicons>
                            <Text style={{ color: "#7DCEA0", fontSize: 10, paddingLeft: 5 }}>
                              {isUploadingFile == 2
                                ? `%${uploadProgress}`
                                : post.files[1]
                                ? post.files[1].name
                                : "Anexo 2"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => handlePickFile(1)}>
                          <View
                            style={{
                              paddingLeft: 10,
                              top: 15,
                              alignItems: "center",
                              flexDirection: "row"
                            }}
                          >
                            <Ionicons
                              name="ios-attach"
                              size={20}
                              color="#FFC300"
                            ></Ionicons>
                            <Text style={{ color: "#7DCEA0", fontSize: 10, paddingLeft: 5 }}>
                              {isUploadingFile == 2
                                ? `%${uploadProgress}`
                                : post.files[1]
                                ? post.files[1].name
                                : "Anexo 2"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {file1 ? (
                      <>
                        <TouchableOpacity
                          onPress={() => openFile1(post.files[0].url)}
                        >
                          <View
                            style={{
                              paddingLeft: 10,
                              top: 10,
                              alignItems: 'center',
                              flexDirection: "row"
                            }}
                          >
                            <Ionicons
                              name="ios-attach"
                              size={20}
                              color="#FFC300"
                            ></Ionicons>
                            <Text style={{ color: "#7DCEA0", fontSize: 10, paddingLeft: 5 }}>
                              {post.files[0] ? post.files[0].name : "Anexo 1"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <></>
                    )}
                    {file2 ? (
                      <>
                        <TouchableOpacity
                          onPress={() => openFile2(post.files[1].url)}
                        >
                          <View
                            style={{
                              paddingLeft: 10,
                              top: 15,
                              alignItems: "center",
                              flexDirection: "row"
                            }}
                          >
                            <Ionicons
                              name="ios-attach"
                              size={20}
                              color="#FFC300"
                            ></Ionicons>
                            <Text style={{ color: "#7DCEA0", fontSize: 10, paddingLeft: 5 }}>
                              {post.files[1] ? post.files[1].name : "Anexo 2"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <></>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginHorizontal: 32,
            paddingBottom: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              onPress={handleLikePost}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome
                name={post.didILiked == true ? "heart" : "heart-o"}
                style={{ color: "#FFC300", fontSize: 15 }}
              />
              <Text style={{ marginLeft: 3, fontSize: 12, color: "#C8C8C8" }}>
                {post.likes.length}
              </Text>
            </TouchableOpacity>
            {userIsPostOwner ? (
              <>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Excluir",
                      "Deseja excluir sua dúvida?",
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
                            handleDeletePost();
                          },
                        },
                      ],
                      { cancelable: false }
                    )
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 15,
                  }}
                >
                  <Feather name="trash-2" size={15} color="#E73751"></Feather>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Reportar",
                      "Deseja reportar esse post por possuir conteúdo ofensivo ou inapropriado?",
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
                            reportPost();
                          },
                        },
                      ],
                      { cancelable: false }
                    )
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 15,
                  }}
                >
                  <Feather
                    name="alert-octagon"
                    size={15}
                    color="#FF5733"
                  ></Feather>
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {post.solved ? (
              <>
                <Text
                  style={{
                    color: "#7DCEA0",
                    fontWeight: "bold",
                    paddingRight: 5,
                  }}
                >
                  Esclarecido
                </Text>
                <Feather
                  name="check-circle"
                  size={20}
                  color="#7DCEA0"
                ></Feather>
              </>
            ) : post.type === false ? (
              <>
                <Text
                  style={{
                    color: "#E73751",
                    fontWeight: "bold",
                    paddingRight: 5,
                  }}
                >
                  Esclarecido
                </Text>
                <Feather name="x-circle" size={20} color="#E73751"></Feather>
              </>
            ) : (
              <Text />
            )}
          </View>
        </View>
      </View>

      <View style={styles.Body}>
        <View style={styles.BodyFlat}>
          <FlatList
            data={comments}
            // style={styles.commentsList}
            keyExtractor={(comment) => String(comment._id)}
            onEndReached={loadComments}
            onEndReachedThreshold={0.2}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={reloadPage}
            ListFooterComponent={renderFooter}
            removeClippedSubviews={false}
            renderItem={({ item: comment }) => (
              <Animatable.View
                style={styles.post}
                animation="fadeInDown"
                duration={1000}
              >
                <View style={styles.postHeader}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <TouchableOpacity
                      style={styles.postTitulo}
                      onPress={() => navigateToProfile(comment.user._id)}
                    >
                      <Image
                        style={styles.avatar}
                        source={{
                          uri: comment.user.url
                            ? comment.user.url
                            : "https://www.colegiodepadua.com.br/img/user.png",
                        }}
                      />
                      <Text style={styles.postTitle}>{comment.user.name}</Text>
                    </TouchableOpacity>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.Nomepost}>
                        {handleDate(comment.postedIn)}
                      </Text>
                      {comment.user._id === activeUser || userIsPostOwner ? (
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Excluir",
                              "Deseja excluir sua Resposta?",
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
                                    handleDeleteComment(comment._id);
                                  },
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
                      ) : null}
                    </View>
                  </View>
                </View>
                <View style={styles.postDesc}>
                  <Text
                    style={styles.postDescricao}
                    selectable={true}
                    selectionColor="#FFC300"
                  >
                    {comment.message}
                  </Text>
                </View>
                <View
                  style={{
                    marginLeft: 25,
                    paddingBottom: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleLikeComment(comment._id)}
                    >
                      <FontAwesome
                        name={comment.didILiked == true ? "heart" : "heart-o"}
                        style={{ color: "red", fontSize: 12 }}
                      />
                    </TouchableOpacity>
                    <Text
                      style={{ marginLeft: 3, fontSize: 12, color: "gray" }}
                    >
                      {comment.likes.length}
                    </Text>
                  </View>
                  {post.type === false &&
                  (userIsPostOwner || comment.solvedPost) ? (
                    <>
                      <TouchableOpacity
                        onPress={() => handleSolvePost(comment._id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          paddingRight: 15,
                        }}
                      >
                        <Text
                          style={{
                            color: "#7DCEA0",
                            fontSize: 12,
                            paddingRight: 2,
                          }}
                        >
                          Esclareceu sua dúvida?{" "}
                        </Text>
                        <Feather
                          name={
                            comment.solvedPost == true
                              ? "check-circle"
                              : "circle"
                          }
                          size={15}
                          color="#7DCEA0"
                        ></Feather>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <></>
                  )}
                </View>
              </Animatable.View>
            )}
          ></FlatList>
        </View>

        <Animatable.View
          style={styles.footer}
          animation="fadeInUp"
          duration={900}
        >
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Escreva uma resposta..."
            placeholderTextColor="#365478"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            multiline={true}
            numberOfLines={2}
            style={styles.InputT}
          />
          <TouchableOpacity onPress={handlePostComment}>
            <Feather name="send" size={20} color="#FFC300"></Feather>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </View>
  );
}
