const modules = [
  ["用户认证与权限", "注册、登录、JWT签发、身份校验"],
  ["协作活动管理", "活动CRUD、成员管理、状态管理"],
  ["场地预约", "申请、审批、驳回、取消、冲突检测"],
  ["设备借用", "申请、审批、借出、归还、状态流转"],
  ["任务分工", "任务创建、分配、状态更新"],
  ["进度留痕", "任务进度日志与说明"],
  ["操作日志", "关键业务行为追踪"],
  ["统计分析", "全局统计与活动统计"],
];

const apis = [
  ["auth","POST","/api/auth/register","用户注册"],["auth","POST","/api/auth/login","用户登录"],["auth","GET","/api/users/me","当前用户"],
  ["activities","POST","/api/activities","创建活动"],["activities","GET","/api/activities","活动列表"],["activities","GET","/api/activities/{id}","活动详情"],["activities","PUT","/api/activities/{id}","修改活动"],["activities","DELETE","/api/activities/{id}","删除活动"],["activities","POST","/api/activities/{id}/members","添加成员"],["activities","DELETE","/api/activities/{id}/members/{user_id}","移除成员"],
  ["venues","GET","/api/venues","场地列表"],["venues","POST","/api/venues","创建场地"],["venues","POST","/api/venue-bookings","创建预约"],["venues","POST","/api/venue-bookings/{id}/approve","审批通过"],["venues","POST","/api/venue-bookings/{id}/reject","审批驳回"],["venues","POST","/api/venue-bookings/{id}/cancel","取消预约"],
  ["devices","GET","/api/devices","设备列表"],["devices","POST","/api/devices","创建设备"],["devices","POST","/api/device-borrows","借用申请"],["devices","POST","/api/device-borrows/{id}/approve","借用审批"],["devices","POST","/api/device-borrows/{id}/checkout","借出登记"],["devices","POST","/api/device-borrows/{id}/return","归还登记"],
  ["tasks","POST","/api/tasks","创建任务"],["tasks","GET","/api/tasks","任务列表"],["tasks","POST","/api/tasks/{id}/status","更新状态"],["tasks","POST","/api/tasks/{id}/progress-logs","添加进度记录"],["tasks","GET","/api/activities/{id}/tasks","活动任务列表"],
  ["logs","GET","/api/operation-logs","操作日志列表"],["logs","GET","/api/activities/{id}/operation-logs","活动日志"],
  ["stats","GET","/api/stats/overview","系统总览统计"],["stats","GET","/api/stats/activities/{id}","活动统计"],
];

const grid = document.getElementById("moduleGrid");
modules.forEach(([title, desc]) => {
  const c = document.createElement("div"); c.className = "card";
  c.innerHTML = `<h3>${title}</h3><p>${desc}</p>`; grid.appendChild(c);
});

const groups = ["all", ...new Set(apis.map(a=>a[0]))];
const filters = document.getElementById("filters");
const list = document.getElementById("apiList");
let current = "all";

function renderButtons(){
  filters.innerHTML = "";
  groups.forEach(g=>{
    const b = document.createElement("button");
    b.textContent = g; b.className = current===g ? "active" : "";
    b.onclick = ()=>{ current = g; renderButtons(); renderApis(); };
    filters.appendChild(b);
  });
}

function renderApis(){
  list.innerHTML = "";
  apis.filter(a => current === "all" || a[0] === current).forEach(([mtdGrp,mtd,path,desc])=>{
    const row = document.createElement("div"); row.className = "api-item";
    row.innerHTML = `<span class="method ${mtd}">${mtd}</span> <code>${path}</code><div>${desc}</div>`;
    list.appendChild(row);
  });
}

renderButtons();
renderApis();
