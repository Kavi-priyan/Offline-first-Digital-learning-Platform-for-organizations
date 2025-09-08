import React, { useState } from 'react';
import { SafeAreaView, Text, View, Button, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [lessons, setLessons] = useState([]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Nabha Learning (Mobile)</Text>
        <Button title="Add Sample Lesson (Local)" onPress={() => {
          const l = { id: String(Date.now()), title: 'Fractions Lesson', content: 'Intro to Fractions', version: 1, updatedAt: new Date().toISOString() };
          setLessons(prev => [l, ...prev]);
        }} />
        <View style={{ height: 12 }} />
        <Button title="Scan QR to Import (Placeholder)" onPress={() => {}} />
        <View style={{ height: 12 }} />
        <Button title="Export Lessons (Placeholder)" onPress={() => {}} />

        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 8 }}>
              <Text>{item.title}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
