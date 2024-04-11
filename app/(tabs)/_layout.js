import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const TabsLayout = () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="recipes"
        options={{
          headerShown: false,
          headerTitle: 'Home',
          title: 'label',
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="fast-food-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          headerShown: false,
          headerTitle: 'User',
          title: 'User',
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chef-hat" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
