"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { InputTodo } from "./InputTodo";
import { TodoItem } from "./TodoItem";
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export const TodoList = () => {
  const [session, setSession] = useState(null);
  const [inputText, setInputText] = useState("");
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  // ✨ 追加: ダークモードの状態管理
  const [darkMode, setDarkMode] = useState(false);

  // ✨ 追加: ダークモードの切り替え関数
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    // HTMLタグに 'dark' クラスを付け外しする
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) {
        console.log("エラー:", error);
        toast.error("データの取得に失敗しました");
      } else {
        setTodos(data);
      }
    };
    fetchTodos();

    const channel = supabase
      .channel("todo_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTodos((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "DELETE") {
            setTodos((prev) =>
              prev.filter((todo) => todo.id !== payload.old.id),
            );
          } else if (payload.eventType === "UPDATE") {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === payload.new.id ? payload.new : todo,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const completeCount = todos.filter((t) => t.completed).length;

  const level = Math.floor(completeCount / 5) + 1;

  const progress = (completeCount % 5) * 20;

  const getTitle = (lv) => {
    if (lv >= 10) return "👑 タスクの神";
    if (lv >= 5) return "👑 タスクの神";
    if (lv >= 3) return "✨ ベテラン";
    return "🥚 見習い";
  };

  const handleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: "github" });
    } catch (error) {
      toast.error("ログインに失敗しました");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTodos([]);
    toast.success("ログアウトしました");
  };

  const onClickAdd = async () => {
    if (inputText.trim() === "") return;
    setIsLoading(true);
    const { error } = await supabase
      .from("todos")
      .insert([{ text: inputText, completed: false }]);

    if (error) {
      console.log("追加エラー:", error);
      toast.error("追加に失敗しました");
    } else {
      setInputText("");
      toast.success("タスクを追加しました！");
    }
    setIsLoading(false);
  };

  const onClickDelete = async (id) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      console.log("削除エラー:", error);
      toast.error("削除に失敗しました");
    } else {
      setTodos(todos.filter((todo) => todo.id !== id));
      toast.success("タスクを削除しました");
    }
  };

  const onClickComplete = async (id) => {
    const todoToUpdate = todos.find((todo) => todo.id === id);
    const newStatus = !todoToUpdate.completed;
    const { error } = await supabase
      .from("todos")
      .update({ completed: newStatus })
      .eq("id", id);

    if (error) {
      console.log("更新エラー:", error);
      toast.error("更新に失敗しました");
    } else {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed: newStatus } : todo,
        ),
      );
      if (newStatus) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        const audio = new Audio("/レベルアップ.mp3"); // 音源ファイル名に合わせて調整してください
        audio.volume = 0.5;
        audio.play().catch((e) => console.log("音声再生エラー:", e));
        toast.success("タスクを完了しました！お疲れ様です 🎉");
      } else {
        toast.success("タスクを未完了に戻しました");
      }
    }
  };

  const onClickEdit = async (id, newText) => {
    const { error } = await supabase
      .from("todos")
      .update({ text: newText })
      .eq("id", id);
    if (error) {
      console.log("編集エラー:", error);
      toast.error("編集に失敗しました");
    } else {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, text: newText } : todo,
        ),
      );
      toast.success("タスクを更新しました");
    }
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
  });

  const emptyMessages = {
    all: "タスクがありません 🎉\n新しいタスクを追加してみましょう！",
    active: "全てのタスクが完了しています！\n素晴らしいですね ✨",
    completed:
      "完了したタスクはまだありません。\n少しずつ進めていきましょう 💪",
  };

  // --- ログイン画面 ---
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Toaster position="top-center" />
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center transition-colors duration-300">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">
            ようこそ Todoアプリへ
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            使うにはログインしてください
          </p>
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

  // --- メイン画面 ---
  return (
    <div className="min-h-screen py-10 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Toaster position="bottom-right" reverseOrder={false} />

      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            My Todo
          </h1>
          <div className="flex items-center gap-4">
            {/* ✨ 追加: ダークモード切り替えボタン */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 underline"
            >
              ログアウト
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-sm font-bold text-blue-500 dark:text-blue-400">
                Lv.{level}
              </span>
              <span className="text-lg font-bold ml-2 text-gray-700 dark:text-gray-200">
                {getTitle(level)}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              あと {5 - (completeCount % 5)} タスクでUP!
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        {/* InputTodoの周りも色調整が必要かもですが、まずはコンテナ背景でカバー */}
        <InputTodo
          inputText={inputText}
          setInputText={setInputText}
          onClickAdd={onClickAdd}
          disabled={isLoading}
        />

        <div className="flex justify-center space-x-2 mb-6 mt-6">
          {["all", "active", "completed"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full transition-colors ${
                filter === type
                  ? "bg-blue-500 text-white font-bold"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {type === "all"
                ? "すべて"
                : type === "active"
                  ? "未完了"
                  : "完了"}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 min-h-[150px] flex flex-col justify-center transition-colors duration-300">
          {filteredTodos.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              <p className="whitespace-pre-line leading-relaxed text-sm">
                {emptyMessages[filter]}
              </p>
            </div>
          ) : (
            <ul className="w-full space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredTodos.map((todo) => (
                  <motion.li
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TodoItem
                      todo={todo}
                      onClickComplete={onClickComplete}
                      onClickDelete={onClickDelete}
                      onClickEdit={onClickEdit}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
