import { APP_NAME, TOOL_CARDS } from "@private-assistant/shared";

const roadmap = [
  "账号登录与家庭成员管理",
  "工具中心与收藏",
  "提醒、备忘、家庭常用入口",
  "管理后台与访问日志",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="hero-tag">{APP_NAME}</span>
        <h1>一个给家人用的私人助理工具台</h1>
        <p>
          先把登录、注册、用户管理和工具中心打稳，后面再按家庭场景持续加小功能。
        </p>
        <div className="hero-actions">
          <a className="primary-action" href="/login">
            去登录页
          </a>
          <a className="secondary-action" href="/register">
            去注册页
          </a>
          <a className="secondary-action" href="/dashboard">
            去工具台
          </a>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel-card">
          <h2>第一期范围</h2>
          <ul>
            {roadmap.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <h2>家庭工具方向</h2>
          <div className="tool-grid">
            {TOOL_CARDS.map((tool) => (
              <div key={tool.title} className="tool-card">
                <strong>{tool.title}</strong>
                <span>{tool.description}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
