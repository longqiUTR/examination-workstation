// 错题笔记字数限制常量。
// 不能放在 "use server" 文件里（"use server" 文件只允许 export async functions），
// 所以单独放一个普通模块，server action 和 client 组件都能 import。
export const MAX_NOTE_LENGTH = 5000;
