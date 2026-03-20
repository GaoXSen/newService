export const APP_NAME = "私人助理";

export const TOOL_CARDS = [
  {
    title: "家庭备忘",
    description: "统一记录常用提醒、待办和重要日期。",
  },
  {
    title: "长辈快捷入口",
    description: "把常去页面、客服电话、缴费入口聚合到一个地方。",
  },
  {
    title: "健康与用药提醒",
    description: "后续可扩展成提醒、记录、导出和共享。",
  },
  {
    title: "家庭服务台",
    description: "登录后统一管理家庭成员、工具权限和常用设置。",
  },
] as const;

export const ROLES = {
  ADMIN: "ADMIN",
  FAMILY: "FAMILY",
} as const;
