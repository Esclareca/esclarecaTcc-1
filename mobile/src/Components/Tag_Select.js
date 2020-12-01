import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity
} from "react-native";
import { showError } from "../common";
import api from "../services/api";
import { MaterialIcons } from "@expo/vector-icons";
import SectionedMultiSelect from 'react-native-sectioned-multi-select';

export default function Tag_Select(props) {
    const [tags, setTags] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchTags()
        async function fetchTags() {
            await loadTags(1)
        }
    }, [])

    async function cadastrarTag() {
        try {
            await api.post('/tags', {
                name: searchText
            }).then(res => {
                setSelectedItems([...selectedItems, res.data._id])
                loadTags(1)
            })
            showSucess(`Tag ${searchText} cadastrada com sucesso`)
        } catch (e) {
            showError(e)
        }
    }

    async function loadTags(pag) {
        if (loading) {
            return;
        }

        if (total > 0 && pag > 1 && tags.length >= total) {
            //Impede que faça a requisição caso a qtd máxima já tenha sido atingida
            return;
        }

        setLoading(true)
        try {
            await api.get('/tags', {
                headers: { search_text: searchText },
                params: { page: pag },
            }).then(t => {
                setPage(pag + 1)
                setTotal(t.headers["x-total-count"]);
                setTags([...tags, ...t.data])
                setLoading(false)
            })
        }
        catch (e) {
            showError(e)
        }
    }
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

    return (
        <SectionedMultiSelect
            items={tags}
            IconRenderer={MaterialIcons}
            uniqueKey="_id"
            selectText="Escolha alguns assuntos..."
            confirmText={"Confirmar"}
            searchPlaceholderText={"Escolha alguns assuntos para seguir"}
            searchAdornment={s => setSearchText(s)}
            noResultsComponent={
                <View>
                    <Text>Nenhum item encontrado</Text>
                    <TouchableOpacity onPress={() => cadastrarTag()} style={styles.button}>
                        <Text style={styles.label2}>Cadastrar Tag</Text>
                    </TouchableOpacity>
                </View>
            }
            onSelectedItemsChange={(sel) => props.onSelectedItemsChange(sel)}
            selectedItems={props.selectedItems}
            loading={loading}
            itemsFlatListProps={{ initialNumToRender: 10, onEndReached: () => { loadTags(page) }, onEndReachedThreshold: 0.2 }}
        />
    );
}
