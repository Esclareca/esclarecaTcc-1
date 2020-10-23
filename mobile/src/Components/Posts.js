import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  AsyncStorage,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import { showError, handleLimitBigText, handleDate } from "../common";
import api from "../services/api";
import { AdMobBanner } from "expo-ads-admob";

export default function Posts(props) {
  const styles = {
    Body: {
      flex: 1,
    },
    BodyFlat: {
      flex: 0.9,
    },
    headerTags: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingLeft: 4,
    },
    postHeader: {
      backgroundColor: "#FAFAFA",
      borderRadius: 8,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      paddingRight: 24,
      paddingLeft: 20,
      paddingTop: 10,
      paddingBottom: 8,
    },

    postDesc: {
      backgroundColor: "white",
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      paddingRight: 24,
      paddingLeft: 24,
      paddingTop: 10,
      paddingBottom: 12,
    },

    postTitulo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    Nomepost: {
      fontSize: 10,
      color: "#C8C8C8",
    },

    postsList: {
      marginTop: 5,
      paddingHorizontal: 8,
    },
    post: {
      borderRadius: 8,
      backgroundColor: "#fff",
      marginBottom: 10,
      shadowColor: "rgb(0, 0, 0)",
      shadowOffset: {
        width: 3,
        height: 3,
      },
      shadowOpacity: 0.8,
      shadowRadius: 5,
      elevation: 3,
    },
    postTitle: {
      fontSize: 16,
      color: "#365478",
      fontWeight: "bold",
      paddingLeft: 10,
    },
    postTag: {
      fontSize: 12,
      color: "#737380",
    },
    postDescricao: {
      fontSize: 15,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 40 / 2,
      borderWidth: 1,
      borderColor: "#D8D9DB",
    },
  };

  function navigateToPost(post) {
    props.navigation.navigate("PostPage", {
      post,
    });
  }
  function navigateToProfile(userId) {
    props.navigation.navigate("Profile", {
      userId,
    });
  }
  async function handleLike(postId) {
    const user_id = await AsyncStorage.getItem("user"); //Fazer esse puto entrar no estado
    try {
      const response = await api.post(
        `/posts/${postId}/like`,
        {},
        {
          headers: { user_id },
        }
      );
      await props.reloadPosts();
    } catch (e) {
      showError(e);
    }
  }
  renderFooter = () => {
    if (!props.loading) return null;
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  };
  const onLoadMore = useCallback(() => {
    props.loadPosts();
  });

  return (
    <View style={styles.Body}>
      <View style={styles.BodyFlat}>
        <FlatList
          data={props.posts}
          style={styles.postsList}
          keyExtractor={(post) => String(post._id)}
          refreshing={props.refreshing}
          onRefresh={props.reloadPosts}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          renderItem={({ item: post }) =>
            post.ad ? (
              <Animatable.View
                style={styles.post}
                animation="fadeInDown"
                duration={1000}
              >
                <AdMobBanner
                  bannerSize="banner"
                  adUnitID="ca-app-pub-6671400449354043/9787917658"
                  servePersonalizedAds
                  onDidFailToReceiveAdWithError={(err) => console.log(err)}
                  style={{ alignItems: "center" }}
                />
              </Animatable.View>
            ) : (props.searchSolved === false ||
                (props.searchSolved === true && post.solved === true)) &&
              (props.searchFavorite === false ||
                (props.searchFavorite === true && post.didILiked === true)) ? (
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
                    <View
                      style={[styles.postTitulo, { flex: 2, maxWidth: 200 }]}
                    >
                      <Image
                        style={styles.avatar}
                        source={{
                          uri: post.user.url
                            ? post.user.url
                            : "https://www.colegiodepadua.com.br/img/user.png",
                        }}
                      />
                      <TouchableOpacity onPress={() => navigateToPost(post)}>
                        <Text style={styles.postTitle}>{post.title}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ alignItems: "flex-end", flex: 1 }}>
                      <TouchableOpacity
                        style={{ alignItems: "flex-end" }}
                        onPress={() => navigateToProfile(post.user._id)}
                      >
                        <Text style={styles.Nomepost}>{post.user.name}</Text>
                        <Text style={styles.Nomepost}>
                          {handleDate(post.postedIn)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.headerTags}>
                    <Text style={styles.postTag}>{post.tags.join(', ')}</Text>
                    <TouchableOpacity
                      style={styles.Ver}
                      onPress={() => navigateToPost(post)}
                    >
                      <Feather
                        name="chevron-right"
                        size={25}
                        color="#FFC300"
                      ></Feather>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.postDesc}>
                  <Text
                    selectable={true}
                    selectionColor="#FFC300"
                    style={styles.postDescricao}
                  >
                    {handleLimitBigText(post.desc)}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 25,
                    paddingBottom: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => handleLike(post._id)}
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <FontAwesome
                        name={post.didILiked == true ? "heart" : "heart-o"}
                        style={{ color: "red", fontSize: 12 }}
                      />
                      <Text
                        style={{ marginLeft: 3, fontSize: 12, color: "gray" }}
                      >
                        {post.likes.length}
                      </Text>
                    </TouchableOpacity>
                    <FontAwesome
                      name="commenting-o"
                      style={{ color: "#D8D9DB", fontSize: 12, marginLeft: 15 }}
                    />
                    <Text
                      style={{ marginLeft: 3, fontSize: 12, color: "gray" }}
                    >
                      {post.commentsCount}
                    </Text>
                  </View>
                  {post.solved && post.solved === true ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#7DCEA0",
                          fontWeight: "800",
                        }}
                      >
                        Dúvida finalizada
                      </Text>
                      <Feather
                        name="check-circle"
                        size={15}
                        color="#7DCEA0"
                        style={{ marginLeft: 5 }}
                      ></Feather>
                    </View>
                  ) : null}
                </View>
              </Animatable.View>
            ) : (
              <View></View>
            )
          }
        ></FlatList>
      </View>
    </View>
  );
}
