import React, { useState, useEffect, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  AsyncStorage,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Posts from "../../Components/Posts";
import api from "../../services/api";
import styles from "./styles";
import * as Animatable from "react-native-animatable";
import { AuthContext } from "../../context";
import Tag_Select from "../../Components/Tag_Select";

import { showError } from "../../common";

export default function Home() {
  const [selectedItems, setSelectedItems] = useState([])
  async function onSelectedItemsChange(sele) {
    setSelectedItems(sele);
  };

  const { singOut } = React.useContext(AuthContext);
  const navigation = useNavigation();

  const [type, setType] = useState(false);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [adCount, setAdCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  //filtro
  const [modalVisible, setModalVisible] = useState(false); //Janela de seleção
  const [searchFavorite, setSearchFavorite] = useState(false);
  const [searchSolved, setSearchSolved] = useState(false);
  const [searchText, setSearchText] = useState("");

  //Pesquisa
  const [modalPesquisaVisible, setModalPesquisaVisible] = useState(false); //Janela de seleção
  const [searchType, setSearchType] = useState("");

  function navigateToNewPost() {
    navigation.navigate("NewPost", {
      type,
    });
  }
  function navigateToDoubts() {
    setType(false);
  }
  function navigateToContent() {
    setType(true);
  }

  useEffect(() => {
    reload();
    async function reload() {
      await reloadPosts();
    }
  }, [type]);

  useFocusEffect(
    useCallback(() => {
      reload();
      async function reload() {
        await reloadPosts();
      }
    }, [])
  );

  function showModal() {
    setModalVisible(!modalVisible);
  }

  function showModalPesquisa() {
    setModalPesquisaVisible(!modalPesquisaVisible);
  }

  async function loadPosts() {
    if (loading) {
      //Impede que uma busca aconteça enquanto uma requisição já foi feita
      return;
    }

    if (total > 0 && posts.length - adCount == total) {
      //Impede que faça a requisição caso a qtd máxima já tenha sido atingida
      return;
    }

    setLoading(true); //Altera para o loading iniciado
    try {
      const response = await api.get("/posts", {
        headers: {
          type,
          search_text: searchType == 'tags' ? selectedItems.join(',') : searchText,
          search_type: searchType,
        },
        params: { page },
      });
      const results = [
        ...posts,
        ...response.data[0].paginatedResults,
        { ad: true, _id: adCount },
      ];
      setPosts(results);
      if (response.data[0].paginatedResults.length > 0) {
        setTotal(response.data[0].totalCount[0].count);
        setPage(page + 1);
        setAdCount(adCount + 1);
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
      const response = await api.get("/posts", {
        headers: {
          type,
          search_text: searchType == 'tags' ? selectedItems.join(',') : searchText,
          search_type: searchType,
        },
        params: { page: 1 },
      });
      const results = [...response.data[0].paginatedResults];
      setPosts(results);
      if (response.data[0].paginatedResults.length > 0) {
        setTotal(response.data[0].totalCount[0].count);
        setPage(2);
        setAdCount(1);
      }
    } catch (e) {
      // console.log(e.request)
      if (e.response.status == 401) {
        Alert.alert(
          "Seu login expirou!",
          "Deseja realizar o login novamente?",
          [
            {
              text: "Não",
              onPress: () => { },
            },
            {
              text: "Sim",
              onPress: () => {
                AsyncStorage.clear();
                singOut();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        showError(e);
      }
    }
    setRefreshing(false);
  }

  return (
    //reidner 26/04
    <View style={styles.container}>
      <View>
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={showModal}
        >
          <TouchableWithoutFeedback onPress={showModal}>
            <View style={styles.modalContent}>
              <View style={styles.modalBody}>
                <View style={styles.modalFilter}>
                  <Text style={styles.filterTitle}>Filtrar Por:</Text>
                </View>
                <View style={styles.filterView}>
                  <View style={styles.filterSub}>
                    <TouchableOpacity
                      style={styles.filterButton}
                      onPress={() => setSearchFavorite(!searchFavorite)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          { color: searchFavorite ? "#FFC300" : "#365478" },
                        ]}
                      >
                        Favoritos
                      </Text>
                      <Feather name="heart" size={12} color="#FFC300" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.filterSub}>
                    <TouchableOpacity
                      style={styles.filterButton}
                      onPress={() => setSearchSolved(!searchSolved)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          { color: searchSolved ? "#FFC300" : "#365478" },
                        ]}
                      >
                        Esclarecidos{" "}
                      </Text>
                      <Feather name="check-circle" size={12} color="#FFC300" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.filterExit}>
                    <TouchableOpacity
                      style={styles.filterButton}
                      onPress={() => {
                        setSearchSolved(false);
                        setSearchFavorite(false);
                      }}
                    >
                      <Text style={styles.filterText}>Sem filtro </Text>
                      <Feather name="x-circle" size={12} color="#E73751" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalPesquisaVisible}
        onRequestClose={showModalPesquisa}
      >
        <TouchableWithoutFeedback onPress={showModalPesquisa}>
          <View style={styles.modalContent}>
            <View style={styles.modalPesquisaBody}>
              <View style={styles.modalFilter}>
                <Text style={styles.filterTitle}>Pesquisar Por:</Text>
              </View>
              <View style={styles.filterView}>
                <View style={styles.filterSub}>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setSearchType("tags")}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        { color: searchType == "tags" ? "#7DCEA0" : "#365478" },
                      ]}
                    >
                      Tags
                    </Text>
                    <Feather name="hash" size={12} color="#7DCEA0" />
                  </TouchableOpacity>
                </View>
                <View style={styles.filterSub}>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setSearchType("desc")}
                  >
                    <View>
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: searchType == "desc" ? "#7DCEA0" : "#365478",
                          },
                        ]}
                      >
                        Descrição
                      </Text>
                    </View>
                    <Feather name="file-text" size={12} color="#7DCEA0" />
                  </TouchableOpacity>
                </View>
                <View style={styles.filterSub}>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setSearchType("title")}
                  >
                    <View>
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color:
                              searchType == "title" ? "#7DCEA0" : "#365478",
                            marginTop: -3,
                          },
                        ]}
                      >
                        Título
                      </Text>
                    </View>
                    <Feather name="file-text" size={12} color="#7DCEA0" />
                  </TouchableOpacity>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: "#C8C8C8",
                  borderRadius: 5,
                  padding: 3,
                }}
              >
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    setSearchType("");
                  }}
                >
                  <Text style={styles.filterText}> Limpar</Text>
                  <Feather name="x-circle" size={12} color="#E73751" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <StatusBar
        barStyle="light-content"
        translucent={false}
        backgroundColor={"#365478"}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.openDrawer()}
        >
          <Feather name="menu" size={20} color="#FFC300"></Feather>
        </TouchableOpacity>
        <Text style={{ fontWeight: "bold", color: "white", fontSize: 25 }}>
          {type == false ? "Dúvidas" : "Conteúdos"}
        </Text>
        <TouchableOpacity style={styles.detailsButton} onPress={showModal}>
          <Feather name="filter" size={20} color="#FFC300"></Feather>
        </TouchableOpacity>
      </View>
      {searchType != 'tags' ?
        <View style={styles.Search}>
          <TextInput
            style={styles.input}
            placeholder="Pesquise o assunto desejado..."
            placeholderTextColor="#999"
            autoCapitalize="words"
            autoCorrect={false}
            value={searchText}
            onChangeText={setSearchText}
            numberOfLines={2}
            returnKeyType="search"
            onSubmitEditing={() => {
              reloadPosts();
            }}
            blurOnSubmit={false}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={reloadPosts}>
              <Feather
                name="search"
                size={18}
                color="#FFC300"
                style={{ marginTop: 2, marginRight: 20 }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={showModalPesquisa}>
              <Feather
                name="more-vertical"
                size={18}
                color="#FFC300"
                style={{ marginTop: 2 }}
              />
            </TouchableOpacity>
          </View>
        </View>
        :
        <View style={styles.Search}>
          <Tag_Select selectedItems={selectedItems} onSelectedItemsChange={onSelectedItemsChange} />
          <TouchableOpacity onPress={reloadPosts}>
            <Feather
              name="search"
              size={18}
              color="#FFC300"
              style={{ marginTop: 2, marginRight: 20 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={showModalPesquisa}>
            <Feather
              name="more-vertical"
              size={18}
              color="#FFC300"
              style={{ marginTop: 2 }}
            />
          </TouchableOpacity>
        </View>
      }

      <Posts
        posts={posts}
        reloadPosts={reloadPosts}
        refreshing={refreshing}
        loadPosts={loadPosts}
        searchSolved={searchSolved}
        searchFavorite={searchFavorite}
        loading={loading}
        navigation={navigation}
        type={type}
      />

      <Animatable.View
        style={styles.footer}
        animation="fadeInUp"
        duration={900}
      >
        <TouchableOpacity style={styles.detailsBar} onPress={navigateToDoubts}>
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
        <TouchableOpacity style={styles.detailsBar} onPress={navigateToContent}>
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
      </Animatable.View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigateToNewPost()}
      >
        <Animatable.View animation="fadeIn">
          <Feather name="plus" size={25} color="white"></Feather>
        </Animatable.View>
      </TouchableOpacity>
    </View >
  );
}
