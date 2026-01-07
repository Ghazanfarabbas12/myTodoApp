import {
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

// ---------------- TYPES ----------------
type Todo = {
  id: string;
  title: string;
  isDone: boolean;
  dueDate: number | string;
  createdAt: number;
};

export default function App() {
  const [activeTab, setActiveTab] =
    useState<"Tasks" | "Add" | "History">("Tasks");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoText, setTodoText] = useState("");
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [editId, setEditId] = useState<string | null>(null);

  // 🔥 SAFE PICKER STATES
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const todoRef = collection(db, "todos");

  // ---------------- SAFE DATE PARSER ----------------
  const parseDate = (value: number | string) => {
    if (typeof value === "number") return new Date(value);
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // ---------------- READ TODOS ----------------
  useEffect(() => {
    const q = query(todoRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Todo[] = [];
      snapshot.forEach((docu) => {
        list.push({ id: docu.id, ...docu.data() } as Todo);
      });
      setTodos(list);
    });
    return () => unsub();
  }, []);

  // ---------------- ADD TASK ----------------
  const addTask = async () => {
    if (!todoText.trim()) {
      Alert.alert("Error", "Enter task title");
      return;
    }

    await addDoc(todoRef, {
      title: todoText,
      dueDate: dueDate.getTime(),
      isDone: false,
      createdAt: Date.now(),
    });

    resetForm();
    setActiveTab("Tasks");
  };

  // ---------------- UPDATE TASK ----------------
  const updateTask = async () => {
    if (!todoText.trim() || !editId) return;

    await updateDoc(doc(db, "todos", editId), {
      title: todoText,
      dueDate: dueDate.getTime(),
    });

    resetForm();
    setActiveTab("Tasks");
  };

  // ---------------- RESET ----------------
  const resetForm = () => {
    setEditId(null);
    setTodoText("");
    setDueDate(new Date());
    inputRef.current?.clear();
  };

  // ---------------- TOGGLE DONE ----------------
  const toggleDone = async (todo: Todo) => {
    await updateDoc(doc(db, "todos", todo.id), {
      isDone: !todo.isDone,
    });
  };

  // ---------------- DELETE ----------------
  const deleteTodo = async (id: string) => {
    await deleteDoc(doc(db, "todos", id));
  };

  const activeTodos = todos.filter((t) => !t.isDone);
  const completedTodos = todos.filter((t) => t.isDone);

  // ---------------- RENDER ----------------
  const renderTab = () => {
    if (activeTab === "Tasks") {
      return (
        <FlatList
          data={activeTodos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.todoCard}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Checkbox
                  value={item.isDone}
                  onValueChange={() => toggleDone(item)}
                />
                <View>
                  <Text style={styles.todoText}>{item.title}</Text>
                  <Text style={styles.metaText}>
                    Due: {parseDate(item.dueDate).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setTodoText(item.title);
                    setDueDate(parseDate(item.dueDate));
                    setEditId(item.id);
                    setActiveTab("Add");
                  }}
                >
                  <Ionicons name="create" size={22} color="#4A90E2" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => deleteTodo(item.id)}>
                  <Ionicons name="trash" size={22} color="#FF4D4D" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      );
    }

    if (activeTab === "Add") {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TextInput
            ref={inputRef}
            placeholder="Task Title"
            value={todoText}
            onChangeText={setTodoText}
            style={styles.input}
          />

          {/* DATE BUTTON */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{dueDate.toLocaleString()}</Text>
          </TouchableOpacity>

          {/* DATE PICKER */}
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                if (event.type === "set" && selectedDate) {
                  setDueDate(selectedDate);
                  setShowDatePicker(false);
                  setShowTimePicker(true); // 👉 open time picker
                } else {
                  setShowDatePicker(false);
                }
              }}
            />
          )}

          {/* TIME PICKER */}
          {showTimePicker && (
            <DateTimePicker
              value={dueDate}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                if (event.type === "set" && selectedTime) {
                  const updated = new Date(dueDate);
                  updated.setHours(selectedTime.getHours());
                  updated.setMinutes(selectedTime.getMinutes());
                  setDueDate(updated);
                }
                setShowTimePicker(false);
              }}
            />
          )}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={editId ? updateTask : addTask}
          >
            <Text style={styles.addBtnText}>
              {editId ? "Update Task" : "Add Task"}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }

    return (
      <FlatList
        data={completedTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.completedCard}>
            <Text>✔ {item.title}</Text>
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Todo App</Text>
      {renderTab()}

      <View style={styles.navBar}>
        {["Tasks", "Add", "History"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.navButton,
                isActive && styles.navButtonActive,
              ]}
              onPress={() => {
                if (tab === "Add") resetForm();
                setActiveTab(tab as any);
              }}
            >
              <Text
                style={[
                  styles.navText,
                  isActive && styles.navTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  header: { fontSize: 26, textAlign: "center", marginBottom: 10 },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  addBtn: {
    backgroundColor: "#4630EB",
    padding: 15,
    borderRadius: 10,
  },
  addBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  todoCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  todoText: { fontSize: 16 },
  metaText: { fontSize: 12, color: "#777" },
  completedCard: {
    padding: 15,
    backgroundColor: "#E6E6E6",
    borderRadius: 10,
    marginBottom: 8,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#F4F4F4",
    borderRadius: 16,
    marginTop: 10,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  navButtonActive: {
    backgroundColor: "#4630EB",
  },
  navText: {
    color: "#333",
    fontWeight: "600",
  },
  navTextActive: {
    color: "#fff",
  },
});
