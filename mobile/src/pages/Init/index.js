import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native'

import { Image, View, AsyncStorage, Text, TouchableOpacity, StatusBar } from "react-native";
import api from '../../services/api'

import logo from '../../assets/logo.png'; // Nessa página poderia usar uma logo maior
import facebookIcon from '../../assets/facebook.png';
import googleIcon from '../../assets/google.png';
import styles from './styles'
import * as Animatable from 'react-native-animatable'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Facebook from 'expo-facebook';
import * as Google from 'expo-google-app-auth'
import { AuthContext } from '../../context'
import { showError } from '../../common'
import UserPermission from '../../UserPermissions';

export default function Init(){
    const navigation = useNavigation()
    const { singIn } = React.useContext(AuthContext);
    const [user, setUser] = useState(null)
    const [emailUser, setEmailUser] = useState('');
    const [nameUser, setNameUser] = useState('');
    const [passUser, setPassUser] = useState('');
    const [avatarUser, setAvatarUser] = useState('');
    
    async function navigateToLogin() {
        navigation.navigate('Login');
    }

    async function navigateToTags() {
        navigation.navigate('Tags',{
            user
        });
    }

    useEffect(() => {
        AsyncStorage.getItem('user').then(user => {
            if (user) {
                navigation.navigate('Home');
            }
        })
        UserPermission.getCameraPermission();
        UserPermission.registerForPushNotifications();
    }, [])

    async function FacebooklogIn() {
        try {
          await Facebook.initializeAsync('788451035063636');
          const {
            type,
            token,
            expires,
            permissions,
            declinedPermissions,
          } = await Facebook.logInWithReadPermissionsAsync('788451035063636',{
            permissions: ['public_profile','email'],
          });
          if (type === 'success') {
            // Get the user's name using Facebook's Graph API
            let data
            const response = await fetch(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture.height(500)`);
            try{
                data = await response.json();
                console.log(data)
            }
            catch{

            }
            try {
                //LOGIN
                const response = await api.post('/signin', {
                    email: data.email, password: data.id
                });
                const login = await response.data;
                
                await AsyncStorage.setItem('user', login.id.toString());
                await AsyncStorage.setItem('userName', login.name.toString());
                await AsyncStorage.setItem('userTags', login.tags.toString());
                singIn();
                
            } catch (e) {
                navigateToTags(data);
            }
            //
          } else {
            // type === 'cancel'
          }
        } catch ({ message }) {
          alert(`Facebook Login Error: ${message}`);
        }
    }

    async function GoogleLogIn(){
        try {
            const result = await Google.logInAsync({
                androidClientId: '366556546753-3da9s6fs4erjut74c3p7usmullq2ep4f.apps.googleusercontent.com',
                iosClientId: '366556546753-nfk1ao48565161rmicqg85ivc9gab100.apps.googleusercontent.com',
                scopes: ['profile', 'email'],
              });
              
            if (result.type === 'success') {
                //setUser(result.user);
                try {
                    //LOGIN
                    const response = await api.post('/signin', {
                        email: result.user.email, password: result.user.id
                    });
                    const login = await response.data;
                    await AsyncStorage.setItem('user', login.id.toString());
                    await AsyncStorage.setItem('userName', login.name.toString());
                    await AsyncStorage.setItem('userTags', login.tags.toString());
                    singIn();
                } catch (e) {
                    navigateToTags(result.user);
                }
            }        
            else {
                
            }      
        } catch (e) {
        return { error: true };
        }
    }

    return(
        <View style={styles.Container}>
            <StatusBar barStyle="light-content" translucent={false} backgroundColor={'#365478'} />
            <View style={styles.Header}>
                <Animatable.Image
                    animation="fadeInUpBig"
                    duration={1500}
                    source={logo}
                    style={styles.Logotype}
                    resizeMode="stretch"
                />
            </View>
            <Animatable.View 
                style={styles.Footer}
                animation="fadeInUpBig">
                <Text style={styles.Title}>Entre e faça parte dos nossos grupos de estudos!</Text>
                <View style={{justifyContent:'center',alignItems:'flex-end'}}>
                    <Text style={styles.Texto}>Faça o login com sua conta:</Text>
                </View>
                <View style={styles.Button}>
                    <View style={{alignContent:'center',flexDirection:'column',justifyContent:'center'}}>
                        <TouchableOpacity style={styles.Google} onPress={GoogleLogIn}>
                            <Image style={{width:25, height:25}} source={googleIcon} />
                            <Text style={styles.GoogleF}>Login com Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.Facebook} onPress={FacebooklogIn}>
                        <Image style={{width:25, height:25}} source={facebookIcon} />
                            <Text style={styles.FacebookF}>Login com Facebook</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={navigateToLogin} style={styles.Register}>
                        <Text style={styles.Inicie}>Entre já</Text>
                        <MaterialIcons name="navigate-next" color="#FFC300" size={25}></MaterialIcons>
                    </TouchableOpacity>
                </View>
            </Animatable.View>
        </View>
    )
}