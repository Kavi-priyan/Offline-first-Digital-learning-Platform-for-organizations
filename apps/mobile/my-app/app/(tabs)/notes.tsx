import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db, Note, Lesson } from '@/src/db/dexie';
import { SyncService } from '@/src/services/syncService';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const syncService = new SyncService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setNotes(await db.notes.toArray());
      setLessons(await db.lessons.toArray());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getLessonTitle = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson?.title || 'Unknown Lesson';
  };

  const handleAddNote = async () => {
    if (!selectedLessonId || !newNoteText.trim()) {
      Alert.alert('Error', 'Please select a lesson and enter note text.');
      return;
    }

    setAddingNote(true);
    try {
      const note: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        lessonId: selectedLessonId,
        text: newNoteText.trim(),
        updatedAt: new Date().toISOString()
      };

      await db.notes.put(note);
      await loadData();
      
      setNewNoteText('');
      setSelectedLessonId('');
      Alert.alert('Success', 'Note added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add note. Please try again.');
      console.error('Add note error:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleSync = async () => {
    try {
      await syncService.syncWithBackend();
      await loadData();
      Alert.alert('Success', 'Notes synced with backend!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync notes.');
      console.error('Sync error:', error);
    }
  };

  const notesByLesson = notes.reduce((acc, note) => {
    if (!acc[note.lessonId]) {
      acc[note.lessonId] = [];
    }
    acc[note.lessonId].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Lesson Notes</ThemedText>
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <ThemedText style={styles.syncButtonText}>Sync</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.addNoteContainer}>
        <ThemedText type="subtitle">Add New Note</ThemedText>
        
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.label}>Select Lesson:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lessonSelector}>
            {lessons.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonButton,
                  selectedLessonId === lesson.id && styles.selectedLessonButton
                ]}
                onPress={() => setSelectedLessonId(lesson.id)}
              >
                <ThemedText style={[
                  styles.lessonButtonText,
                  selectedLessonId === lesson.id && styles.selectedLessonButtonText
                ]}>
                  {lesson.title}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.label}>Note Text:</ThemedText>
          <TextInput
            style={styles.textInput}
            value={newNoteText}
            onChangeText={setNewNoteText}
            placeholder="Enter your note here..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ThemedView>

        <TouchableOpacity 
          style={[styles.addButton, addingNote && styles.disabledButton]} 
          onPress={handleAddNote}
          disabled={addingNote}
        >
          <ThemedText style={styles.addButtonText}>
            {addingNote ? 'Adding...' : 'Add Note'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {Object.keys(notesByLesson).length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>No notes available. Add a note or sync with backend.</ThemedText>
        </ThemedView>
      ) : (
        Object.entries(notesByLesson).map(([lessonId, lessonNotes]) => (
          <ThemedView key={lessonId} style={styles.lessonNotesContainer}>
            <ThemedText type="subtitle" style={styles.lessonTitle}>
              {getLessonTitle(lessonId)}
            </ThemedText>
            {lessonNotes.map((note) => (
              <ThemedView key={note.id} style={styles.noteCard}>
                <ThemedText style={styles.noteText}>{note.text}</ThemedText>
                <ThemedText style={styles.noteDate}>
                  {new Date(note.updatedAt).toLocaleString()}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  addNoteContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151',
  },
  lessonSelector: {
    maxHeight: 40,
  },
  lessonButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
  selectedLessonButton: {
    backgroundColor: '#2563eb',
  },
  lessonButtonText: {
    color: 'black',
    fontSize: 12,
  },
  selectedLessonButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    backgroundColor: 'white',
    fontSize: 16,
    minHeight: 80,
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  lessonNotesContainer: {
    marginBottom: 16,
  },
  lessonTitle: {
    marginBottom: 8,
    color: '#FFFFFF',
  },
  noteCard: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  noteText: {
    marginBottom: 4,
    color: 'black',
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: '#6b7280',
  },
});
