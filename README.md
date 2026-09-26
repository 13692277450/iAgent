# 🦚 iAgent - AI 智能助手集成平台

[English](#english) | [中文](#中文)

![alt text](image-12.png)

Custom prompt to compress token usage to limit.

![alt text](image-13.png)

---

## English

iAgent is a powerful AI assistant integration platform designed for centralized management of AI models, skills, MCP servers, token usage, and more. Built with modern web technologies, it provides a comprehensive solution for enterprise-grade AI applications.

## ✨ Features

### 🤖 AI Chat System
- **Multi-LLM Support**: Integration with DeepSeek, OpenAI, and other AI models via Vercel AI SDK
- **Streaming Responses**: Real-time streaming chat with smooth user experience
- **Conversation Management**: Save, restore, delete conversation history
- **Rich Message Rendering**: Support for Markdown, code highlighting with Shiki, math formulas, Mermaid diagrams

### 📚 RAG (Retrieval-Augmented Generation)
- **Document Upload**: Support for multiple file formats (PDF, Word, etc.)
- **Intelligent Chunking**: Automatic document segmentation and embedding
- **Semantic Search**: Vector-based similarity search for accurate information retrieval
- **Department-based Access Control**: Document permission management by department
- **Security Levels**: Configurable security classification for documents

### 🔌 MCP Server Integration
- **Server Management**: CRUD operations for MCP (Model Context Protocol) servers
- **Tool Discovery**: Automatic discovery and registration of server tools
- **Permission Control**: Read/Write/Admin permission levels
- **Status Monitoring**: Real-time connection status tracking

### 🛠️ Skills System
- **Custom Skills**: Extensible skill framework for specialized tasks
- **Built-in Tools**: Calculator, email sender, renderer, etc.
- **Skill Selection UI**: Visual interface for activating/deactivating skills per conversation
- **Dynamic Loading**: Runtime skill invocation based on context

### 👥 User & Access Management
- **Authentication**: Secure login/logout system
- **Department Organization**: Hierarchical department structure
- **Role-based Permissions**: Fine-grained access control
- **Token Usage Tracking**: Per-user token consumption monitoring

### 📊 Administration Panel
- **LLM Configuration**: Manage AI model endpoints and settings
- **System Prompts**: Customizable system prompt templates
- **Skills Management**: Create, edit, delete custom skills
- **MCP Server Administration**: Full lifecycle management
- **Remote Logging**: Centralized log collection and monitoring

### 🌐 Internationalization (i18n)
- **Multi-language Support**: Chinese, English, Spanish, French, Dutch, Norwegian, Portuguese
- **Dynamic Switching**: Real-time language switching without page reload
- **Locale Detection**: Browser language auto-detection

### 🎨 Modern UI/UX
- **Dark/Light Theme**: Smooth theme switching with system preference detection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Component Library**: Built with shadcn/ui, Ant Design, Tailwind CSS
- **Microphone Input**: Voice input support for hands-free operation
- **File Attachments**: Drag-and-drop file upload with progress indication

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Components** | React 19, Assistant UI, Ant Design 6, shadcn/ui |
| **Styling** | Tailwind CSS 4, PostCSS |
| **State Management** | Zustand 5 |
| **Database** | PostgreSQL with Drizzle ORM |
| **AI SDK** | Vercel AI SDK (@ai-sdk/react, @ai-sdk/openai, @ai-sdk/deepseek) |
| **Document Processing** | pdf-parse, mammoth (Word), @streamdown/* |
| **Code Highlighting** | react-shiki, react-syntax-highlighter |
| **Math Rendering** | mathjs, @streamdown/math |
| **Validation** | Zod 4 |
| **Icons** | Lucide React, @ant-design/icons |

## 📁 Project Structure
src/ ├── app/ # Next.js App Router pages & API routes │ ├── api/ # Backend API endpoints │ │ ├── admin/ # Admin management APIs │ │ ├── chat/ # Chat completion API │ │ ├── conversation/ # Conversation history CRUD │ │ ├── mcp/ # MCP server APIs │ │ ├── rag/ # RAG document upload/query │ │ └── skills/ # Skills management │ ├── chat/ # Frontend chat interface │ └── login/ # Authentication page ├── components/ # Reusable React components │ ├── ai-elements/ # Core AI chat components │ ├── assistant-ui/ # Custom Assistant UI elements │ ├── ui/ # Base UI components (shadcn) │ └── admin/ # Admin panel components ├── lib/ # Business logic & utilities │ ├── rag.ts # RAG retrieval logic │ ├── mcp_servers.ts # MCP server management │ ├── skill_handler.ts # Skill execution engine │ ├── embedding.ts # Text embedding service │ └── auth.ts # Authentication utilities ├── db/ # Database schema (Drizzle ORM) └── i18n/ # Internationalization files



## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm/yarn/pnpm/bun package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url> cd iagent</repository-url>


2. **Install dependencies**
```bash
npm install

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
Database
DATABASE_URL=postgresql://user:password@localhost:5432/iagent

AI Models (example)
OPENAI_API_KEY=your-openai-api-key DEEPSEEK_API_KEY=your-deepseek-api-key

App
NEXTAUTH_SECRET=your-secret-key

4. **Set up the database**

Run database migrations:
```bash
npm run db:push # or use Drizzle migration commands

5. **Start development server**
```bash
npm run dev

6. **Open in browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Basic Chat Flow

1. Login to the platform
2. Select or configure your preferred LLM model
3. Choose relevant skills (if needed)
4. Start chatting with the AI assistant
5. Save important conversations for later reference

### Using RAG Features

1. Navigate to RAG section in settings
2. Upload documents (PDF, Word, etc.)
3. Wait for processing and chunking to complete
4. Ask questions related to uploaded content
5. View source references in AI responses

### Managing MCP Servers

1. Go to MCP Servers management page
2. Add new server with API URL and credentials
3. Configure permissions (read/write/admin)
4. Enable/disable servers as needed
5. Monitor connection status in real-time

### Creating Custom Skills

1. Open Skills management dialog
2. Define skill name, description, and handler
3. Implement skill logic in `src/lib/skill_handler.ts`
4. Assign to conversations as needed

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send chat message with streaming response |
| GET/POST | `/api/conversation/list` | List/save conversations |
| DELETE | `/api/conversation/[id]` | Delete conversation |
| POST | `/api/rag/upload` | Upload documents for RAG |
| POST | `/api/rag/query` | Query RAG knowledge base |
| GET/POST | `/api/mcp_server` | List/create MCP servers |
| PUT/DELETE | `/api/mcp_servers/[id]` | Update/delete MCP server |
| GET/POST | `/api/skills` | List/create skills |
| POST | `/api/login` | User authentication |
| POST | `/api/token` | Token usage statistics |

## 🎯 Key Highlights

- **Enterprise Ready**: Department-based access control, security levels, audit logging
- **Extensible Architecture**: Plugin-style skills and MCP server integration
- **Production Grade**: Type-safe TypeScript, comprehensive error handling
- **Developer Friendly**: Well-documented codebase, modular structure
- **Performance Optimized**: Streaming responses, efficient vector search

## 📈 Recent Updates

- **2026-09-25**: Added microphone input option, enhanced UI polish
- **2026-09-24**: Added remote logger, customer support bot, full admin CRUD panels, multi-file RAG upload with progress bar
- **2026-09-20**: Migrated to Assistant UI, added dark/light mode, RAG data upload, conversation history save
- **2026-09-16**: Added MCP server options, skills selection cards

## 🤝 Contributing

Contributions are welcome! Please feel free to submit Pull Requests.

## 📧 Contact

- Email: m13692277450@outlook.com
- Support Website: [www.pavogroup.top](http://www.pavogroup.top) | [www.aipercy.top](http://www.aipercy.top)

## 📄 License

This project is private. Please contact the author for licensing information.

---

## 中文

iAgent 是一个功能强大的 AI 智能助手集成平台，专为集中管理 AI 模型、技能、MCP 服务器、Token 使用等而设计。采用现代 Web 技术构建，为企业级 AI 应用提供全面的解决方案。

## ✨ 功能特性

### 🤖 AI 对话系统
- **多模型支持**: 通过 Vercel AI SDK 集成 DeepSeek、OpenAI 等多种 AI 模型
- **流式响应**: 实时流式对话，提供流畅的用户体验
- **对话管理**: 保存、恢复、删除对话历史记录
- **富文本渲染**: 支持 Markdown、Shiki 代码高亮、数学公式、Mermaid 图表

### 📚 RAG（检索增强生成）
- **文档上传**: 支持多种文件格式（PDF、Word 等）
- **智能分块**: 自动文档分段和向量化嵌入
- **语义搜索**: 基于向量相似度的精准信息检索
- **部门权限控制**: 基于部门的文档访问权限管理
- **安全等级**: 可配置的文档安全分类级别

### 🔌 MCP 服务器集成
- **服务器管理**: MCP（模型上下文协议）服务器的增删改查操作
- **工具发现**: 自动发现和注册服务器提供的工具
- **权限控制**: 读/写/管理员三级权限管理
- **状态监控**: 实时连接状态追踪

### 🛠️ 技能系统
- **自定义技能**: 可扩展的技能框架，用于专业任务处理
- **内置工具**: 计算器、邮件发送器、渲染器等
- **技能选择界面**: 可视化界面，按会话激活/停用技能
- **动态加载**: 根据上下文运行时调用技能

### 👥 用户与权限管理
- **身份认证**: 安全的登录/登出系统
- **部门组织**: 层级化的部门结构
- **基于角色的权限**: 细粒度的访问控制
- **Token 用量追踪**: 按用户监控 Token 消耗情况

### 📊 管理后台
- **LLM 配置**: 管理 AI 模型端点和设置
- **系统提示词**: 可定制的系统提示模板
- **技能管理**: 创建、编辑、删除自定义技能
- **MCP 服务器管理**: 全生命周期管理
- **远程日志**: 集中式日志收集与监控

### 🌐 国际化（i18n）
- **多语言支持**: 中文、英文、西班牙语、法语、荷兰语、挪威语、葡萄牙语
- **动态切换**: 无需刷新页面即可实时切换语言
- **语言检测**: 自动检测浏览器语言偏好

### 🎨 现代化 UI/UX
- **暗色/亮色主题**: 平滑的主题切换，支持系统偏好检测
- **响应式设计**: 针对桌面端、平板、移动设备优化
- **组件库**: 基于 shadcn/ui、Ant Design、Tailwind CSS 构建
- **麦克风输入**: 支持语音输入，解放双手
- **文件附件**: 拖拽式文件上传，带进度指示

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 16 (App Router) |
| **语言** | TypeScript 5 |
| **UI 组件** | React 19, Assistant UI, Ant Design 6, shadcn/ui |
| **样式** | Tailwind CSS 4, PostCSS |
| **状态管理** | Zustand 5 |
| **数据库** | PostgreSQL + Drizzle ORM |
| **AI SDK** | Vercel AI SDK (@ai-sdk/react, @ai-sdk/openai, @ai-sdk/deepseek) |
| **文档处理** | pdf-parse, mammoth (Word), @streamdown/* |
| **代码高亮** | react-shiki, react-syntax-highlighter |
| **数学渲染** | mathjs, @streamdown/math |
| **数据校验** | Zod 4 |
| **图标** | Lucide React, @ant-design/icons |

## 📁 项目结构
src/ ├── app/ # Next.js App Router 页面和 API 路由 │ ├── api/ # 后端 API 接口 │ │ ├── admin/ # 管理后台 API │ │ ├── chat/ # 对话补全 API │ │ ├── conversation/ # 对话历史增删改查 │ │ ├── mcp/ # MCP 服务器 API │ │ ├── rag/ # RAG 文档上传/查询 │ │ └── skills/ # 技能管理 │ ├── chat/ # 前端对话界面 │ └── login/ # 认证页面 ├── components/ # 可复用 React 组件 │ ├── ai-elements/ # 核心 AI 对话组件 │ ├── assistant-ui/ # 自定义 Assistant UI 元素 │ ├── ui/ # 基础 UI 组件 (shadcn) │ └── admin/ # 管理后台组件 ├── lib/ # 业务逻辑和工具函数 │ ├── rag.ts # RAG 检索逻辑 │ ├── mcp_servers.ts # MCP 服务器管理 │ ├── skill_handler.ts # 技能执行引擎 │ ├── embedding.ts # 文本向量化服务 │ └── auth.ts # 认证工具函数 ├── db/ # 数据库模式 (Drizzle ORM) └── i18n/ # 国际化语言文件

text




## 🚀 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 数据库
- npm/yarn/pnpm/bun 包管理器

### 安装步骤

1. **克隆仓库**
```bash
git clone <仓库地址> cd iagent

2. **安装依赖**
```bash
npm install

3. **配置环境变量**

在根目录创建 `.env` 文件：

```env
数据库
DATABASE_URL=postgresql://用户名:密码@localhost:5432/iagent

AI 模型（示例）
OPENAI_API_KEY=your-openai-api-key DEEPSEEK_API_KEY=your-deepseek-api-key

应用密钥
NEXTAUTH_SECRET=your-secret-key

4. **初始化数据库**

运行数据库迁移：
```bash
npm run db:push # 或使用 Drizzle 迁移命令

5. **启动开发服务器**
```bash
npm run dev

6. **浏览器访问**

打开 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 基本对话流程

1. 登录平台
2. 选择或配置首选的 LLM 模型
3. 选择相关技能（如需要）
4. 开始与 AI 助手对话
5. 保存重要对话以供后续参考

### 使用 RAG 功能

1. 在设置中导航到 RAG 部分
2. 上传文档（PDF、Word 等）
3. 等待处理和分块完成
4. 提问与已上传内容相关的问题
5. 在 AI 回复中查看来源引用

### 管理 MCP 服务器

1. 进入 MCP 服务器管理页面
2. 使用 API URL 和凭据添加新服务器
3. 配置权限（读/写/管理员）
4. 按需启用/禁用服务器
5. 实时监控连接状态

### 创建自定义技能

1. 打开技能管理对话框
2. 定义技能名称、描述和处理程序
3. 在 `src/lib/skill_handler.ts` 中实现技能逻辑
4. 按需分配给对话使用

## 🔧 API 接口

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/chat` | 发送聊天消息（流式响应） |
| GET/POST | `/api/conversation/list` | 列出/保存对话 |
| DELETE | `/api/conversation/[id]` | 删除对话 |
| POST | `/api/rag/upload` | 上传 RAG 文档 |
| POST | `/api/rag/query` | 查询 RAG 知识库 |
| GET/POST | `/api/mcp_server` | 列出/创建 MCP 服务器 |
| PUT/DELETE | `/api/mcp_servers/[id]` | 更新/删除 MCP 服务器 |
| GET/POST | `/api/skills` | 列出/创建技能 |
| POST | `/api/login` | 用户认证 |
| POST | `/api/token` | Token 用量统计 |

## 🎯 项目亮点

- **企业级就绪**: 基于部门的访问控制、安全级别、审计日志
- **可扩展架构**: 插件式技能和 MCP 服务器集成
- **生产级质量**: 类型安全的 TypeScript、完善的错误处理
- **开发者友好**: 代码结构清晰、模块化设计
- **性能优化**: 流式响应、高效向量搜索

## 📈 最近更新

- **2026-09-25**: 新增麦克风输入选项，优化 UI 美观度
- **2026-09-24**: 新增远程日志记录、客户服务机器人、完整的管理后台 CRUD 面板、多文件 RAG 上传及进度条
- **2026-09-20**: 迁移至 Assistant UI、新增暗色/亮色模式、RAG 数据上传、对话历史保存
- **2026-09-16**: 新增 MCP 服务器选项、技能选择卡片

## 🤝 参与贡献

欢迎贡献代码！请随时提交 Pull Request。

## 📧 联系方式

- 邮箱: m13692277450@outlook.com
- 支持网站: [www.pavogroup.top](http://www.pavogroup.top) | [www.aipercy.top](http://www.aipercy.top)

## 📄 许可证

本项目为私有项目。请联系作者获取许可信息。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by iAgent Team

</div>