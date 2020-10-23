import React, { useState } from 'react';
import { Text, View, TouchableOpacity, KeyboardAvoidingView, AsyncStorage, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons'

import styles from './styles'
import { showError, showSucess } from '../../common'
import api from '../../services/api'
import { AuthContext } from '../../context'

export default function ResetPass({ route, navigation }) {
    const [email, setEmail] = useState(route.params.email)
    const [hash, setHash] = useState('');
    const [newPass, setNewPass] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const { singIn } = React.useContext(AuthContext);

    async function handleResetPass() {
        if (newPass.trim() == confirmPass.trim()) {
            if (hash && newPass) {
                let patternPass = /^(?=.*\d)(?=.*[a-z])[0-9a-z]{6,}$/
                if (patternPass.test(newPass)) {
                    try {
                        await api.post('/resetPass', {
                            email, hash, newPass
                        }).then(resetPass => {
                            if (resetPass.status == 200) {
                                sign()
                                async function sign() {
                                    await api.post('/signin', {
                                        email: email, password: newPass, type: 'app'
                                    }).then(login => {
                                        log()
                                        async function log() {
                                            await AsyncStorage.setItem("token", login.data.token.toString());
                                            await AsyncStorage.setItem('user', login.data.id.toString());
                                            await AsyncStorage.setItem('userName', login.data.name.toString());
                                            await AsyncStorage.setItem('userTags', login.data.tags.toString());
                                            showSucess(`Senha alterada com sucesso!`)
                                            singIn();
                                        }
                                    })
                                }
                            }
                        })
                    } catch (e) {
                        showError(e)
                    }
                } else {
                    showError("Ajuste sua senha para que tenha pelo menos 1 número e 6 caracteres! :)")
                }
            }
            else {
                showError("Digite os campos para prosseguir.")
            }
        }
        else {
            showError("A confirmação da senha está divergente da senha informada!")
        }
    }

    return (
        <KeyboardAvoidingView behavior="" style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="chevron-left" size={20} color="#FFC300"></Feather>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 20, marginRight: 5 }}>Esqueci a senha</Text>
                </View>
            </View>
            <View style={styles.forms}>
                <Text style={styles.label1}>Digite o código enviado no email:</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={hash}
                    onChangeText={setHash}
                    returnKeyType={"next"}
                    onSubmitEditing={() => { this.secondTextInput.focus(); }}
                    blurOnSubmit={false}
                    ref={(input) => { this.firstTextInput = input; }}
                />
                <Text style={styles.label2}>Digite a nova senha:</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor="#999"
                    secureTextEntry={true}
                    password={true}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={newPass}
                    onChangeText={setNewPass}
                    returnKeyType="next"
                    onSubmitEditing={() => { this.thirdTextInput.focus(); }}
                    blurOnSubmit={false}
                    ref={(input) => { this.secondTextInput = input; }}
                />
                <Text style={styles.label2}>Confirme a nova senha:</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor="#999"
                    secureTextEntry={true}
                    password={true}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    returnKeyType="done"
                    onSubmitEditing={() => { handleResetPass() }}
                    blurOnSubmit={false}
                    ref={(input) => { this.thirdTextInput = input; }}
                />
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }} onPress={handleResetPass}>
                    <Text style={styles.label}>Salvar</Text>
                    <Feather name="chevron-right" size={24} style={{ top: 1, left: 2 }} color="#FFC300"></Feather>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}