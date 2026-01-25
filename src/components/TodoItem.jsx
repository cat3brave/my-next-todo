import React from "react";

export const TodoItem = (props) => {
  const { todo, onClickComplete, onClickDelete } = props;

  return (
    <li className="flex justify-between items-center p-3 mb-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <span
          className={`text-lg ${todo.completed ? "text-gray-400 line-through" : "text-gray-800"}`}
        >
          {todo.text}
        </span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onClickComplete(todo.id)}
          className={`text-sm px-3 py-1 rounded transition-colors ${
            todo.completed
              ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
              : "bg-green-100 text-green-600 hover:bg-green-200"
          }`}
        >
          {todo.completed ? "戻す" : "完了"}
        </button>
        <button
          onClick={() => onClickDelete(todo.id)}
          className="text-sm px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
        >
          削除
        </button>
      </div>
    </li>
  );
};
