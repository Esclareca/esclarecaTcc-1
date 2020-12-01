import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native'

import { Image, View, AsyncStorage, KeyboardAvoidingView, Text, TextInput, TouchableOpacity, StatusBar, ScrollView } from "react-native";
import api from '../../services/api'

import styles from './styles'
import * as Animatable from 'react-native-animatable'
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import UserPermission from '../../UserPermissions';

import { showError, showSucess } from '../../common'

export default function Register() {
    const navigation = useNavigation()

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [avatar, setAvatar] = useState('https://www.colegiodepadua.com.br/img/user.png');

    //Inserir tratamento para caso tente inserir vazio
    async function handleSubmit() {
        if (email && name && password && confirmPass) {
            if (password === confirmPass) {
                let patternMail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                if (patternMail.test(email)) {
                    let patternPass = /^(?=.*[a-z])(?=.*[0-9]).{6,64}$/
                    if (patternPass.test(password)) {
                        try {
                            const response = await api.post('/signup', {
                                name, email, password, tags: [], type: 'app'
                            })
                            if (response.status == 204) {
                                showSucess("Usuário cadastrado com sucesso")
                                try {
                                    const response = await api.post('/signin', {
                                        email, password: password, type: 'app'
                                    });
                                    const user = response.data;
                                    try {
                                        await AsyncStorage.setItem("token", user.token.toString());
                                        await AsyncStorage.setItem('user', user.id.toString());
                                        await AsyncStorage.setItem('userName', user.name.toString());
                                        if (avatar != 'https://www.colegiodepadua.com.br/img/user.png') {
                                            try {
                                                handleSubmitPhoto(user.id)
                                            }
                                            catch (k) {
                                                showError(x)
                                            }
                                        }
                                        navigation.navigate("Tags", {
                                            userId: user.id, isRegistering: true
                                        });
                                        // singIn();
                                    } catch (x) {
                                        showError(x)
                                    }
                                } catch (e) {
                                    showError("Error:\n" + e)
                                }
                            } else {
                                showError("Erro")
                            }

                        } catch (e) {
                            showError(e)
                        }
                    }
                    else {
                        showError("Ajuste sua senha para que tenha pelo menos 6 caracteres, sendo ao menos 1 letra e 1 número! :)")
                    }
                }
                else {
                    showError("Poxa, seu email está inválido. Insira-o novamente! :D")
                }
            }
            else {
                showError('Hmmm... suas senhas não são compatíveis. Insira novamente! ;)')
            }
        }
        else {
            showError('Parece que existem campos em branco. Insira-os para continuarmos! ;)')
        }
    }

    async function handlePickUpdate() {
        UserPermission.getCameraPermission()

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4]
        })

        if (!result.cancelled) {
            setAvatar(result)
            //setIsUploadingImage(true)
        }
    }

    async function handleSubmitPhoto(idUser) {
        let localUri = avatar.uri;
        let filename = localUri.split('/').pop();
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image`;
        try {
            const data = new FormData();
            data.append('file', { uri: localUri, name: filename, type })
            const response = await api.post(`/users/${idUser}/photo`, data)
            if (response.status == 201) {
                //showSucess("Foto alterada com sucesso")
                //setIsUploadingImage(false)
                //await loadUser(userId)
            } else {
                showError(response)
            }
        }
        catch (e) {
            showError(e)
        }
    }

    return (
        <KeyboardAvoidingView behavior="" style={styles.container}>
            <StatusBar barStyle="light-content" translucent={false} backgroundColor={'#365478'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="chevron-left" size={20} color="#FFC300"></Feather>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} style={{flexDirection: 'row'}}>
                    <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 20, marginRight: 5 }}>Registre-se</Text>
                    <Feather name="chevron-right" size={20} color="#FFC300" />
                </TouchableOpacity>
            </View>
            <View style={styles.forms}>
                <TouchableOpacity style={styles.circle} onPress={() => handlePickUpdate()}>
                    <Image style={{ width: 120, height: 120, borderRadius: 120 / 2, borderWidth: 3, borderColor: "#FFF" }}
                        source={{ uri: avatar == 'https://www.colegiodepadua.com.br/img/user.png' ? avatar : avatar.uri }} />
                </TouchableOpacity>

                <ScrollView style={{ top: 20 }}>
                    <Animatable.View
                        style={styles.form}
                        animation="fadeIn">
                        <Text style={styles.label1}>Nome</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Insira seu nome"
                            placeholderTextColor="#999"
                            autoCapitalize="words"
                            autoCorrect={false}
                            value={name}
                            onChangeText={setName}
                            returnKeyType={"next"}
                            onSubmitEditing={() => { this.secondTextInput.focus(); }}
                            blurOnSubmit={false}
                        />
                        <Text style={styles.label}>E-mail</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Seu e-mail"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={email}
                            onChangeText={setEmail}
                            returnKeyType={"next"}
                            onSubmitEditing={() => { this.thirdTextInput.focus(); }}
                            blurOnSubmit={false}
                            ref={(input) => { this.secondTextInput = input; }}
                        />
                        <Text style={styles.label}>Senha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="6 caracteres com no mínimo 1 dígito numérico"
                            placeholderTextColor="#999"
                            secureTextEntry={true}
                            password={true}
                            autoCapitalize="words"
                            autoCorrect={false}
                            value={password}
                            onChangeText={setPassword}
                            returnKeyType={"next"}
                            onSubmitEditing={() => { this.fourthTextInput.focus(); }}
                            blurOnSubmit={false}
                            ref={(input) => { this.thirdTextInput = input; }}
                        />
                        <Text style={styles.label}>Insira novamente</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirme sua senha"
                            placeholderTextColor="#999"
                            secureTextEntry={true}
                            password={true}
                            autoCapitalize="words"
                            autoCorrect={false}
                            value={confirmPass}
                            onChangeText={setConfirmPass}
                            returnKeyType={"next"}
                            onSubmitEditing={() => handleSubmit()}
                            blurOnSubmit={false}
                            ref={(input) => { this.fourthTextInput = input; }}
                        />
                    </Animatable.View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    )
}