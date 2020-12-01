import Constants from 'expo-constants'
import * as Permissions from 'expo-permissions'
import * as Notifications from 'expo-notifications';
import api from "../src/services/api";
import { AsyncStorage } from 'react-native';

class UserPermission {
    getCameraPermission = async () => {
        if(Constants.platform.ios || Constants.platform.android){
            const {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL)

            if (status != "granted"){
                alert("Precisamos da permissão para continuar");
                return
            }
        }
    }
    
    registerForPushNotifications = async () => {
      if (Constants.isDevice) {
        const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('Failed to get push token for push notification!');
          return;
        }
      } else {
        alert('Must use physical device for Push Notifications');
      }
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          //Simportance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }      
    }
}

export default new UserPermission();