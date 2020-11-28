import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Switch,
  AsyncStorage,
  FlatList,
} from "react-native";
import { Feather, FontAwesome, Foundation } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import Dialog from "react-native-dialog";
import { showError, showSucess, handleDate } from "../../common";
import styles from "./styles";
import api from "../../services/api";
import { AdMobBanner } from "expo-ads-admob";

export default function HomeSlack(props) {
  const navigation = useNavigation();

  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [privadoModal, setPrivadoModal] = useState(false);

  const [senha, setSenha] = useState("");

  const [nomeModal, setNomeModal] = useState("");
  const [tagModal, setTagModal] = useState("");
  const [senhaModal, setSenhaModal] = useState("");

  const [slackToLog, setSlackToLog] = useState();
  const [slacks, setSlacks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [idU, setIdU] = useState("");

  const handlePrivadoModal = () =>
    setPrivadoModal((previousState) => !previousState);

  function handleModal() {
    setModalVisible(!modalVisible);
  }

  async function handleDialog() {
    setDialogVisible((previousState) => !previousState);
    setSenha("");
  }

  useFocusEffect(
    useCallback(() => {
      reload();
      async function reload() {
        await reloadSlacks();
      }
    }, [])
  );

  async function loadSlacks() {
    if (loading) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }

    if (total > 0 && slacks.length == total) {
      //Impede que faça a requisição caso a qtd máxima já tenha sido atingida
      return;
    }

    const user_id = await AsyncStorage.getItem("user");
    setIdU(user_id);

    try {
      const response = await api.get(`/slacks`, {
        headers: { user_id, search_text: searchText },
        params: { page },
      });

      if (response.status == 200) {
        setSlacks([...slacks, ...response.data]);
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

  const onLoadMore = useCallback(() => {
    loadSlacks();
  });

  async function reloadSlacks() {
    if (refreshing) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }

    const user_id = await AsyncStorage.getItem("user");
    setIdU(user_id);

    try {
      const response = await api.get(`/slacks`, {
        headers: { user_id, search_text: searchText },
        params: { page: 1 },
      });
      setSlacks(response.data);

      if (response.data.length > 0) {
        setPage(2);
      }
      setTotal(response.headers["x-total-count"]);
      setRefreshing(false); //Conclui o load
    } catch (e) {
      showError(e);
    }
  }

  async function handleCreateSlack() {
    const user_id = await AsyncStorage.getItem("user");
    if (nomeModal.trim() == "" || tagModal.trim() == "") {
      showError("Os campos nome e tag são obrigatórios");
    }
    try {
      const response = await api.post(
        `/slacks`,
        {
          nome: nomeModal,
          tag: tagModal,
          senha: privadoModal ? senhaModal : "", //Garantir que seja enviado sem senha caso o switch esteja desativado mas tenha texto preenchido
        },
        {
          headers: { user_id },
        }
      );
      if (response.status == 201) {
        // showSucess("EsclaChat criado com sucesso");
        setNomeModal("");
        setTagModal("");
        setPrivadoModal(false);
        setSenhaModal("");
        handleModal();
        // reloadSlacks();
        navigateToSlack(response.data, response.data.senha)
      } else {
        showError("Ocorreu um erro: " + response);
      }
    } catch (e) {
      showError(e);
    }
  }
  async function handleDeleteSlack(slackParam) {
    const user_id = await AsyncStorage.getItem("user");
    try {
      const response = await api.delete(`/slacks/${slackParam._id}`, {
        headers: { user_id },
      });
      if (response.status == 204) {
        showSucess("EsclaChat apagado com sucesso");
        await reloadSlacks();
      } else {
        showError("Ocorreu um erro: " + response);
      }
    } catch (e) {
      showError(e);
    }
  }

  function handleProtectedSlack() {
    if (slackToLog.senha != "") {
      if (senha === slackToLog.senha) {
        setSenha("");
        setDialogVisible((previousState) => !previousState);
        navigation.navigate("SlackPage", { slack: slackToLog });
      } else {
        setSenha("");
        Alert.alert(
          "Erro",
          "Senha Incorreta. Digite Novamente",
          [
            {
              text: "OK",
              onPress: () => {
                return null;
              },
            },
          ],
          { cancelable: false }
        );
      }
    }
  }
  async function navigateToSlack(slackParam, senha) {
    if (slackParam.senha == "" || senha != slackParam) {
      navigation.navigate("SlackPage", { slack: slackParam });
    } else {
      setSlackToLog(slackParam);
      setDialogVisible((previousState) => !previousState);
    }
  }

  function navigateToProfile(userId) {
    props.navigation.navigate("Profile", {
      userId,
    });
  }

  renderFooter = () => {
    if (!loading || !refreshing) return null;
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Modal de digitar senha */}
      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>EsclaChat Privada</Dialog.Title>
        <Dialog.Description>Digite a senha para continuar:</Dialog.Description>
        <Dialog.Input
          style={{ borderBottomWidth: 1, borderBottomColor: "#D8D9DB" }}
          secureTextEntry={true}
          password={true}
          value={senha}
          onChangeText={setSenha}
        />
        <Dialog.Button label="Entrar" onPress={handleProtectedSlack} />
        <Dialog.Button label="Cancelar" onPress={handleDialog} />
      </Dialog.Container>
      {/* Fim Modal de digita senha */}
      {/* Modal de novo Slack */}
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
                    <Text style={styles.perfilTitle}>Criar EsclaChat </Text>
                    <Feather
                      name="plus-circle"
                      size={17}
                      color="#365478"
                    ></Feather>
                  </View>
                  <View style={styles.viewInput}>
                    <Text style={styles.modalSubtitle}>Nome</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Indique o nome do EsclaChat..."
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                      autoCorrect={false}
                      value={nomeModal}
                      onChangeText={setNomeModal}
                      numberOfLines={2}
                      returnKeyType={"next"}
                      onSubmitEditing={() => {
                        this.secondTextInput.focus();
                      }}
                      blurOnSubmit={false}
                    />
                  </View>
                  <View style={styles.viewInput}>
                    <Text style={styles.modalSubtitle}>Tag</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Indique o tag do EsclaChat..."
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                      autoCorrect={false}
                      value={tagModal}
                      onChangeText={setTagModal}
                      numberOfLines={2}
                      returnKeyType={"done"}
                      ref={(input) => {
                        this.secondTextInput = input;
                      }}
                    />
                  </View>
                  <View style={styles.viewInput}>
                    <Text style={styles.modalSubtitle}>É privado?</Text>
                    <Switch
                      trackColor={{ false: "#D8D9DB", true: "#7DCEA0" }}
                      thumbColor={privadoModal ? "#7DCEA0" : "#f4f3f4"}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={handlePrivadoModal}
                      value={privadoModal}
                    />
                  </View>
                  <View style={styles.viewInput}>
                    {privadoModal ? (
                      <>
                        <Text style={styles.modalSubtitle}>Senha</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Indique a senha para acesso..."
                          placeholderTextColor="#999"
                          secureTextEntry={true}
                          password={true}
                          autoCorrect={false}
                          value={senhaModal}
                          onChangeText={setSenhaModal}
                          numberOfLines={2}
                          returnKeyType="done"
                        />
                      </>
                    ) : (
                        <></>
                      )}
                  </View>
                  <View style={styles.buttonView}>
                    <TouchableOpacity
                      onPress={handleCreateSlack}
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
      {/* Fim Modal de novo Slack */}
      {/* Cabeçalho */}
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
              marginRight: 8,
            }}
          >
            EsclaChat
          </Text>
          <Foundation
            name="lightbulb"
            size={30}
            color="#FFC300"
            style={{ marginBottom: 5 }}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 32,
          paddingVertical: 10,
        }}
      >
        <TextInput
          style={styles.input}
          placeholder="Indique tag de um EsclaChat..."
          placeholderTextColor="#999"
          autoCapitalize="words"
          autoCorrect={false}
          value={searchText}
          onChangeText={setSearchText}
          numberOfLines={2}
          returnKeyType="search"
          onSubmitEditing={() => {
            reloadSlacks();
          }}
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={() => reloadSlacks()}>
          <Feather
            name="search"
            size={18}
            color="#FFC300"
            style={{ marginTop: 2 }}
          />
        </TouchableOpacity>
      </View>
      {/* Fim cabeçalho */}
      {/* Lista dos slacks */}
      <FlatList
        data={slacks}
        // style={styles.post}
        keyExtractor={(slack) => String(slack._id)}
        refreshing={refreshing}
        onRefresh={reloadSlacks}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: slack }) => (
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
                <View style={styles.postTitulo}>
                  <Feather
                    name={slack.senha != "" ? "lock" : "unlock"}
                    size={14}
                    color={slack.senha != "" ? "#5AAAA5" : "#7DCEA0"}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.postTitle}>{slack.nome}</Text>
                  <FontAwesome
                    name="commenting-o"
                    style={{ color: "#D8D9DB", fontSize: 12, marginLeft: 8 }}
                  />
                  <Text style={{ marginLeft: 2, fontSize: 10, color: "gray" }}>
                    {slack.messages}
                  </Text>
                </View>
                <Text style={styles.Nomepost}>
                  Criado em: {handleDate(slack.createdIn)}
                </Text>
              </View>
              <View style={styles.headerTags}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={() => navigateToProfile(slack.user._id)}
                  >
                    <Text style={styles.Nomepost}>
                      {slack.user ? slack.user.name : ""}
                    </Text>
                    <Text style={styles.Nomepost}>
                      {slack.tag ? slack.tag[0] : ""}
                    </Text>
                  </TouchableOpacity>
                  {idU === slack.user._id ? (
                    <>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert(
                            "Excluir",
                            "Deseja excluir sua slack?",
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
                                  handleDeleteSlack(slack);
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
                <TouchableOpacity
                  style={styles.Ver}
                  onPress={() => navigateToSlack(slack)}
                >
                  <Feather
                    name="chevron-right"
                    size={25}
                    color="#FFC300"
                  ></Feather>
                </TouchableOpacity>
              </View>
            </View>
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
      {/* Botão de adicionar Slack */}
      <TouchableOpacity style={styles.addButton} onPress={handleModal}>
        <Animatable.View animation="fadeIn">
          <Feather name="plus" size={25} color="white"></Feather>
        </Animatable.View>
      </TouchableOpacity>
    </View>
  );
}
