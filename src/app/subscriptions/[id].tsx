import { Link, useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

const SubscriptionDetail = () => {
    const {id} = useLocalSearchParams<{id: string}>()
  return (
    <View>
      <Text>Subscription Detail: {id}</Text>
      <Link href="../" className="mt-4 p-4  bg-primary text-white rounded">
     Go Back
      </Link>
    </View>
  )
}

export default SubscriptionDetail