"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { InputTodo } from "./InputTodo";
import { TodoItem } from "./TodoItem";

export const TodoList = () => {
  const [session, setSession] = useState(null);
  const [inputText, setInputText] = useState("");
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // 1. ログイン状態を監視する
  useEffect(() => {
    // 最初に「今ログインしてる？」を確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // ログインしたりログアウトしたりするのを監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. ログインしている時だけタスクを取得
  useEffect(() => {
    if (!session) return; // ログインしてなければ何もしない

    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) console.log("エラー:", error);
      else setTodos(data);
    };

    fetchTodos();
  }, [session]);

  // 3. GitHubでログインする関数
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
    });
  };

  // 4. ログアウトする関数
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTodos([]); // 画面のタスクもクリア
  };

  // --- タスク操作系（変更なし） ---
  const onClickAdd = async () => {
    if (inputText === "") return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from("todos")
      .insert([{ text: inputText, completed: false }]) // user_idは自動で入る！
      .select();
    if (error) console.log("追加エラー:", error);
    else {
      setTodos([...todos, data[0]]);
      setInputText("");
    }

    setIsLoading(false);
  };

  const onClickDelete = async (id) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) console.log("削除エラー:", error);
    else setTodos(todos.filter((todo) => todo.id !== id));
  };

  const onClickComplete = async (id) => {
    const todoToUpdate = todos.find((todo) => todo.id === id);
    const newStatus = !todoToUpdate.completed;
    const { error } = await supabase
      .from("todos")
      .update({ completed: newStatus })
      .eq("id", id);
    if (error) console.log("更新エラー:", error);
    else {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed: newStatus } : todo,
        ),
      );
    }
  };

  const onClickEdit = async (id, newText) => {
    const { error } = await supabase
      .from("todos")
      .update({ text: newText })
      .eq("id", id);

    if (error) console.log("編集エラー:", error);
    else {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, text: newText } : todo,
        ),
      );
    }
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
  });

  // --- 画面表示 ---

  // ログインしていない場合 → 「ログインボタン」だけ表示
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">ようこそ Todoアプリへ</h1>
          <p className="mb-6 text-gray-600">使うにはログインしてください</p>
          <button
            onClick={handleLogin}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition"
          >
            GitHubでログイン
          </button>
        </div>
      </div>
    );
  }

  // ログインしている場合 → 「いつものアプリ」を表示
  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-xl mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">My Todo</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 underline"
        >
          ログアウト
        </button>
      </div>

      <InputTodo
        inputText={inputText}
        setInputText={setInputText}
        onClickAdd={onClickAdd}
        disabled={isLoading}
      />

      <div className="flex justify-center space-x-2 mb-6">
        {["all", "active", "completed"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full transition-colors ${
              filter === type
                ? "bg-blue-500 text-white font-bold"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {type === "all" ? "すべて" : type === "active" ? "未完了" : "完了"}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <ul>
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onClickComplete={onClickComplete}
              onClickDelete={onClickDelete}
              onClickEdit={onClickEdit}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};
