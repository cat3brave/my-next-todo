import React from "react";

export const InputTodo = (props) => {
  const { inputText, setInputText, onClickAdd } = props;

  return (
    <div className="flex space-x-2 mb-6">
      <input
        placeholder="買うものを入力"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      />
      <button
        onClick={onClickAdd}
        className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-md whitespace-nowrap"
      >
        追加
      </button>
    </div>
  );
};
