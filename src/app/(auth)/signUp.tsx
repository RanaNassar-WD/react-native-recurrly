import { Link } from 'expo-router'
import { Text, View } from 'react-native'

const signUp = () => {
  return (
    <View>
      <Text>signUp</Text>
      <Link href="/(auth)/signIn" className="mt-4 p-4  bg-primary text-white rounded">
        Sign In
      </Link>
    </View>
  )
}

export default signUp