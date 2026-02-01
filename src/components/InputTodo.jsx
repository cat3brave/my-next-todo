import React from "react";

export const InputTodo = (props) => {
  const { inputText, setInputText, onClickAdd, disabled } = props;

  return (
    <div className="flex space-x-2 mb-6">
      <input
        disabled={disabled}
        type="text"
        placeholder="買うものを入力"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="flex-1 p-2 rounded-md border border-gray-300 outline-none focus:border-blue-500 disabled:opacity-50"
      />
      <button
        disabled={disabled}
        onClick={onClickAdd}
        className={`px-6 py-2 rounded-md font-bold text-white transition ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {disabled ? "送信中..." : "追加"}
      </button>
    </div>
  );
};
