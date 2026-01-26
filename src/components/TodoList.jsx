"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase"; // 👈 さっき作った接続ツールを読み込み
import { InputTodo } from "./InputTodo";
import { TodoItem } from "./TodoItem";

export const TodoList = () => {
  const [inputText, setInputText] = useState("");
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");

  // 1. アプリ起動時に Supabase からタスクを取得
  useEffect(() => {
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) console.log("エラー:", error);
      else setTodos(data);
    };

    fetchTodos();
  }, []);

  // 2. タスクを追加（Supabaseに保存）
  const onClickAdd = async () => {
    if (inputText === "") return;

    const { data, error } = await supabase
      .from("todos")
      .insert([{ text: inputText, completed: false }])
      .select();

    if (error) {
      console.log("追加エラー:", error);
    } else {
      // 成功したら画面にも即座に反映
      setTodos([...todos, data[0]]);
      setInputText("");
    }
  };

  // 3. タスクを削除（Supabaseから消去）
  const onClickDelete = async (id) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) {
      console.log("削除エラー:", error);
    } else {
      setTodos(todos.filter((todo) => todo.id !== id));
    }
  };

  // 4. 完了状態の切り替え（Supabaseを更新）
  const onClickComplete = async (id) => {
    const todoToUpdate = todos.find((todo) => todo.id === id);
    const newStatus = !todoToUpdate.completed;

    const { error } = await supabase
      .from("todos")
      .update({ completed: newStatus })
      .eq("id", id);

    if (error) {
      console.log("更新エラー:", error);
    } else {
      setTodos(
        todos.map((todo) => {
          if (todo.id === id) return { ...todo, completed: newStatus };
          return todo;
        }),
      );
    }
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
  });

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-xl mt-10">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
        Supabase Todo
      </h1>
      <InputTodo
        inputText={inputText}
        setInputText={setInputText}
        onClickAdd={onClickAdd}
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
            />
          ))}
        </ul>
      </div>
    </div>
  );
};
