import React from 'react';
import { StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#365478',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#365478',
    borderBottomWidth: 1,
    borderBottomColor: '#365478',
    height: 70,
    alignItems: 'center',
    minHeight: hp('10%'),
  },
  forms: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: '20%',
    minHeight: hp('50%')
  },
  label2: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 15,
    paddingLeft: 5
  },
  label1: {
    fontWeight: 'bold',
    color: '#365478',
    fontSize: 18,
    paddingLeft: 5
  },
  label: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 20,
    left: 2
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#B2BABB',
    backgroundColor: 'white',
    fontSize: hp('1.8%'),
    color: '#707B7C',
    minHeight: hp('4.5%'),
    marginBottom: hp('2%'),
    borderRadius: 5,
    paddingHorizontal: 10
  },
  button: {
    height: hp('5%'),
    width: wp('50%'),
    backgroundColor: '#365478',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    marginTop: hp('2%')
  },
});

export default styles;