import React from 'react';
import {StyleSheet} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#365478',
  },
  header:{
    flexDirection:'row',
    justifyContent:'space-between',
    paddingVertical:12,
    paddingHorizontal:32,
    backgroundColor:'#365478',
    borderBottomWidth:1,
    borderBottomColor:'#365478',
    height:70,
    alignItems:'center',
    height:hp('10%'),
  },
  forms:{
    justifyContent: 'center',
    alignItems: 'center', 
    backgroundColor:'white', 
    borderRadius:10,
    marginHorizontal:30,
    marginTop:'50%',
    // height:hp('20%')
  },
  label1: {
      fontWeight: 'bold',
      color: '#365478',
      fontSize: 18,
      top:1
  },
  label2: {
    fontWeight: 'bold',
    color: '#365478',
    fontSize: 18,
    top:1
},
  label: {
    fontWeight: 'bold',
    color: '#365478',
    fontSize: 20,
    left:2
},
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#B2BABB',
    backgroundColor: 'white',
    fontSize: hp('1.8%'),
    color: '#707B7C',
    height: hp('3%'),
    marginBottom: hp('1%'),
    borderRadius: 5,
    paddingHorizontal:60,
    alignItems:'center',
    justifyContent:'center'
  },
  button: {
    height: hp('5%'),
    width:wp('50%'),
    backgroundColor: '#365478',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    marginTop: hp('2%')
  },
});

export default styles;