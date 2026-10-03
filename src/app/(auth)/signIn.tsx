import { Link } from 'expo-router'
import { Text, View } from 'react-native'

const signIn = () => {
  return (
    <View>
      <Text>signIn</Text>
       <Link href="/(auth)/signUp" className="mt-4 p-4  bg-primary text-white rounded">
        Sign Up
      </Link>
    </View>
  )
}

export default signIn