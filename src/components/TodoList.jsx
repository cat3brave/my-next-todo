"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { InputTodo } from "./InputTodo";
import { TodoItem } from "./TodoItem";
// ✨ 追加: トースト通知用のライブラリをインポート
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";

export const TodoList = () => {
  const [session, setSession] = useState(null);
  const [inputText, setInputText] = useState("");
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

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
        toast.error("データの取得に失敗しました"); // ✨ エラー通知
      } else {
        setTodos(data);
      }
    };
    fetchTodos();

    const channel = supabase
      .channel("todo_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTodo = payload.new;
            setTodos((prev) => [...prev, newTodo]);
          } else if (payload.eventType === "DELETE") {
            const deletedID = payload.old.id;
            setTodos((prev) => prev.filter((todo) => todo.id !== deletedID));
          } else if (payload.eventType === "UPDATE") {
            const updatedTodo = payload.new;
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === updatedTodo.id ? updatedTodo : todo,
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
    toast.success("ログアウトしました"); // ✨ ログアウト通知
  };

  const onClickAdd = async () => {
    if (inputText.trim() === "") return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("todos")
      .insert([{ text: inputText, completed: false }])
      .select();

    if (error) {
      console.log("追加エラー:", error);
      toast.error("追加に失敗しました"); // ✨ エラー通知
    } else {
      // setTodos([...todos, data[0]]);
      setInputText("");
      toast.success("タスクを追加しました！"); // ✨ 成功通知
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
      toast.success("タスクを削除しました"); // ✨ 成功通知
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
      // ✨ 状態に合わせてメッセージを変える小技
      if (newStatus) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        const audio = new Audio("/レベルアップ.mp3");
        audio.volume = 0.5;
        audio.play();

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
      toast.success("タスクを更新しました"); // ✨ 成功通知
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

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        {/* ✨ 追加: これがないと通知が表示されません */}
        <Toaster position="top-center" />
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

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-xl mt-10">
      {/* ✨ 追加: ここにも配置（ログイン後の画面用） */}
      <Toaster position="bottom-right" reverseOrder={false} />

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
            className={`px-4 py-2 rounded-full transition-colors ${filter === type ? "bg-blue-500 text-white font-bold" : "bg-gray-200 hover:bg-gray-300"}`}
          >
            {type === "all" ? "すべて" : type === "active" ? "未完了" : "完了"}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 min-h-[150px] flex flex-col justify-center">
        {filteredTodos.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <p className="whitespace-pre-line leading-relaxed text-sm">
              {emptyMessages[filter]}
            </p>
          </div>
        ) : (
          <ul className="w-full">
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
        )}
      </div>
    </div>
  );
};
