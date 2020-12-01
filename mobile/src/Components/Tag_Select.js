import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity
} from "react-native";
import { showError, showSucess } from "../common";
import api from "../services/api";
import { MaterialIcons } from "@expo/vector-icons";
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

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
                props.onSelectedItemsChange([...props.selectedItems, res.data._id])
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
        button: {
            height: hp('5%'),
            width: wp('50%'),
            backgroundColor: '#365478',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 50,
            marginTop: hp('2%')
        },
        label2: {
            fontWeight: 'bold',
            color: 'white',
            fontSize: 15,
            paddingLeft: 5
        },
    };

    return (
        <SectionedMultiSelect
            items={tags}
            IconRenderer={MaterialIcons}
            uniqueKey="_id"
            selectText={props.single ? "Escolha o assunto..." : "Escolha alguns assuntos..."}
            confirmText={"Confirmar"}
            searchPlaceholderText={props.single ? "Escolha o assunto..." : "Escolha alguns assuntos..."}
            searchAdornment={s => setSearchText(s)}
            noResultsComponent={
                <View>
                    <Text>Nenhum item encontrado</Text>
                    <TouchableOpacity onPress={() => cadastrarTag()} style={styles.button}>
                        <Text style={styles.label2}>Cadastrar Tag</Text>
                    </TouchableOpacity>
                </View>
            }
            single={props.single ? props.single : false}
            onSelectedItemsChange={(sel) => props.onSelectedItemsChange(sel)}
            selectedItems={props.selectedItems}
            loading={loading}
            itemsFlatListProps={{ initialNumToRender: 10, onEndReached: () => { loadTags(page) }, onEndReachedThreshold: 0.2 }}
        />
    );
}
