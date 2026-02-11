import React, { useState } from "react";
import { format } from "date-fns";

export const TodoItem = ({
  todo,
  onClickComplete,
  onClickDelete,
  onClickEdit,
}) => {
  // 「今、編集モードですか？」という状態を持つ
  const [isEditing, setIsEditing] = useState(false);
  // 「編集中の文字」を持つ
  const [editText, setEditText] = useState(todo.text);

  // 保存ボタンを押した時の動き
  const handleSave = () => {
    onClickEdit(todo.id, editText); // 親の関数を使ってSupabaseを更新
    setIsEditing(false); // 編集モード終了
  };

  return (
    <div className="flex justify-between items-center p-2 border-b border-gray-100">
      {/* ここから条件分岐！
         「編集中なら入力欄」を、「通常ならテキスト」を表示します
      */}

      {isEditing ? (
        /* --- 🅰️ 編集モードの時の見た目 --- */
        <div className="flex items-center flex-1 mr-2 space-x-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 p-1 border border-blue-400 rounded outline-none"
          />
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-blue-600"
          >
            保存
          </button>
          <button
            onClick={() => setIsEditing(false)} // キャンセルしたらモードを戻す
            className="bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold hover:bg-gray-500"
          >
            取消
          </button>
        </div>
      ) : (
        /* --- 🅱️ 通常モードの時の見た目 --- */
        <div className="flex flex-col flex-1">
          <span
            className={`text-lg ${
              todo.completed ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {todo.text}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            {todo.created_at &&
              format(new Date(todo.created_at), "yyyy/MM/dd HH:mm")}
          </span>
        </div>
      )}

      {
        /* --- 右側のボタンたち（編集モードの時は隠すこともできますが、今回はシンプルにそのまま） --- */
        !isEditing && (
          <div className="flex space-x-2 ml-2">
            {/* 編集ボタン（完了してる時は押せないようにしてみる） */}
            {!todo.completed && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-yellow-400 text-white px-3 py-1 rounded-md text-sm font-bold hover:bg-yellow-500 transition"
              >
                編集
              </button>
            )}

            <button
              onClick={() => onClickComplete(todo.id)}
              className={`px-3 py-1 rounded-md text-sm font-bold transition ${
                todo.completed
                  ? "bg-gray-300 text-white hover:bg-gray-400"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {todo.completed ? "戻す" : "完了"}
            </button>
            <button
              onClick={() => onClickDelete(todo.id)}
              className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold hover:bg-red-600 transition"
            >
              削除
            </button>
          </div>
        )
      }
    </div>
  );
};
