import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { AuthContext } from '../../context'

import styles from "./styles";
import { showError, showSucess } from "../../common";
import api from "../../services/api";
import Tag_Select from "../../Components/Tag_Select";

export default function Tags({ route, navigation }) {
  const { singIn } = React.useContext(AuthContext);
  const userId = route.params.userId;
  const isRegistering = route.params.isRegistering ? route.params.isRegistering : false;
  const [selectedItems, setSelectedItems] = useState([])
  async function onSelectedItemsChange(sele) {
    setSelectedItems(sele);
  };

  useEffect(() => {
    loadUser()
    async function loadUser() {
      try {
        const response = await api.get(`/users/${userId}`, {
          headers: { user_id: userId },
        });
        if (response.data) {
          setSelectedItems(response.data.user.tags.map((tag) => tag._id));
        }
      } catch (e) {
        showError(e)
      }
    }
  }, [route.params.userId]);

  async function handleSubmit() {
    if (selectedItems.length < 1) {
      showError("Selecione ao menos uma tag antes de prosseguir")
    }
    await api.patch('/users', {
      tags: selectedItems
    }).then((ok) => {
      if (isRegistering == true) {
        showSucess("Cadastro finalizado com sucesso!")
        singIn()
      } else {
        showSucess("Tags alteradas com sucesso!")
        navigation.goBack()
      }
    })
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
      <View style={styles.forms}>
        <Text style={styles.label1}>Feeds com a sua cara!</Text>
        <Text style={styles.label1}>Escolha os assuntos de seu interesse:</Text>
        <Tag_Select selectedItems={selectedItems} onSelectedItemsChange={onSelectedItemsChange} />
      </View>

    </KeyboardAvoidingView>

  );
}
