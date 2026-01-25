"use client"; // 👈 【重要】これを書かないとエラーになります！

import React, { useEffect, useState } from "react";
import { InputTodo } from "./InputTodo";
import { TodoItem } from "./TodoItem";

export const TodoList = () => {
  const [inputText, setInputText] = useState("");
  const [todos, setTodos] = useState([]); // 初期値は空にする（エラー防止）
  const [filter, setFilter] = useState("all");

  // 【重要】初回マウント時だけ localStorage から読み込む
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos_list_data");
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // todos が変わったら保存する
  useEffect(() => {
    // 初回読み込み前（空配列のとき）に上書き保存しないためのガード
    if (todos.length > 0 || localStorage.getItem("todos_list_data")) {
      localStorage.setItem("todos_list_data", JSON.stringify(todos));
    }
  }, [todos]);

  const onClickAdd = () => {
    if (inputText === "") return;
    const newTodo = {
      id: crypto.randomUUID(),
      text: inputText,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInputText("");
  };

  const onClickDelete = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const onClickComplete = (id) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === id) return { ...todo, completed: !todo.completed };
        return todo;
      }),
    );
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
  });

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-xl mt-10">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
        Next.js Todo
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
