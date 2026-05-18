export const COLLEGE_OPTIONS = [
  "钱学森书院",
  "仲英书院",
  "南洋书院",
  "彭康书院",
  "崇实书院",
  "励志书院",
  "宗濂书院",
  "启德书院",
  "机械工程学院",
  "电气工程学院",
  "电子与信息学部",
  "能源与动力工程学院",
  "数学与统计学院",
  "管理学院",
  "其他",
];

const statusMap: Record<string, string> = {
  pending: "待开始",
  in_progress: "进行中",
  completed: "已完成",
  delayed: "已延期",
  cancelled: "已取消",
  approved: "已通过",
  rejected: "已拒绝",
  borrowed: "借用中",
  returned: "已归还",
  available: "可用",
  maintenance: "维护中",
  disabled: "停用",
  draft: "草稿",
  ongoing: "进行中",
  finished: "已结束",
};

const roleMap: Record<string, string> = {
  student: "学生",
  teacher: "教师",
  admin: "管理员",
};

const actionMap: Record<string, string> = {
  create: "创建",
  update: "修改",
  delete: "删除",
  add_member: "添加成员",
  remove_member: "移除成员",
  status_update: "更新任务状态",
  add_progress: "添加进度记录",
  approve: "通过",
  reject: "拒绝",
  cancel: "取消",
  apply: "发起申请",
  checkout: "确认借出",
  return: "确认归还",
};

export function zhStatus(v?: string) {
  return statusMap[v || ""] || v || "-";
}
export function zhRole(v?: string) {
  return roleMap[v || ""] || v || "-";
}
export function zhAction(v?: string) {
  return actionMap[v || ""] || v || "-";
}
