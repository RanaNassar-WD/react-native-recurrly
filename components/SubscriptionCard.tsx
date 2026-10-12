import clsx from 'clsx'
import { Pressable, Text, View } from 'react-native'
import SubscriptionIcon from '../src/components/SubscriptionIcon'
import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from '../lib/utils'

const SubscriptionCard = ({ name, price, icon, currency, billing, color, category, plan, renewalDate, expanded, onPress, paymentMethod, startDate, status }: SubscriptionCardProps) => {
    return (
        <>
        <Pressable onPress={onPress} className={clsx('sub-card', expanded ? 'sub-card-expanded' : 'bg-card', 'bg-color')} style={!expanded && color ? { backgroundColor: color } : {}} >
            <View className="sub-head">
                <View className="sub-main">
                    <SubscriptionIcon icon={icon} />
                    <View className="sub-copy">
                        <Text number-of-lines={1} className="sub-title">{name}</Text>
                        <Text number-of-lines={1} className="sub-meta">{category?.trim() || plan?.trim() || renewalDate ? formatSubscriptionDateTime(renewalDate) : ''}</Text>
                    </View>
                </View>
                <View className="sub-price-box">
                    <Text className="sub-price">{formatCurrency(price, currency)}</Text>
                    <Text className="sub-billing">{billing}</Text>
                </View>
            </View>
            {expanded && (
                <View className="sub-bdy">
                    <View className="sub-details">
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-row-label">Payment: </Text>
                                <Text className="sub-value" number-of-lines={1} ellipsis-mode="tail">
                                    {paymentMethod?.trim() || 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-row-label">Category: </Text>
                                <Text className="sub-value" number-of-lines={1} ellipsis-mode="tail">
                                    {category?.trim() || plan?.trim() || 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-row-label">started: </Text>
                                <Text className="sub-value" number-of-lines={1} ellipsis-mode="tail">
                                    {startDate ? formatSubscriptionDateTime(startDate) : 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-row-label">Renewal Date: </Text>
                                <Text className="sub-value" number-of-lines={1} ellipsis-mode="tail">
                                    {renewalDate ? formatSubscriptionDateTime(renewalDate) : 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-row-label">status: </Text>
                                <Text className="sub-value" number-of-lines={1} ellipsis-mode="tail">
                                    {status ? formatStatusLabel(status) : 'Not provided'}
                                </Text>
                            </View>
                        </View>
                        
                    </View>
                </View>
            )}

        </Pressable>
    
        </>
    )
}

export default SubscriptionCard